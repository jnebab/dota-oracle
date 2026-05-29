# Draft Oracle — project context for Claude Code

A Dota 2 **draft + live-match advisor**. Given the player's hero pool, role, rank, and the
allied/enemy lineup, it recommends which carry to pick — ranked by current-patch (7.41c) meta,
matchups (counters/synergy), and **rank bracket** — and produces a lineup-tuned item build for
each pick. It can also pull a *live* game off STRATZ by username or SteamID and auto-fill the board.

> The original single-file prototype (`prototype/DraftOracle.jsx`) contained the full scoring engine
> and all hero/meta/build data. **Milestone 1 lifts that logic and data into proper packages** —
> we port it, we don't rewrite it from scratch.

## Stack (decided)
- **Frontend** `apps/web` — React 18 + TypeScript + **Vite**, Tailwind, **TanStack Query**. SPA.
- **Backend** `apps/api` — **FastAPI** (Python), Pydantic v2, **httpx** (async), **uv** for packaging.
  - **SQLModel** + SQLite (local) / Postgres (prod) for optional saved drafts/pools.
- **Shared packages**
  - `packages/engine` — **pure TypeScript** scoring (no React, no IO): counters, synergy, kit-tag
    interactions, meta-tier weighting, bracket re-weighting, and the item-build engine. Unit-tested (vitest).
  - `packages/data` — versioned hero/counter/synergy/build/bracketFit/meta data with **zod** schemas.
    Single source of truth, imported by web and engine.
- **Tooling** — pnpm workspaces + Turborepo (JS), uv (Python). Biome (JS lint/format), ruff (Python).

## Deployment (decided: all on Vercel, free Hobby tier)
- `apps/web` → Vercel static build (`apps/web/dist`).
- `apps/api` → Vercel **Python serverless functions** under `/api/*`.
- **STRATZ token + all secrets** → Vercel env vars, server-side only. Never in the client bundle or git.
- Cache → **Upstash Redis** (free tier), REST client.
- **Meta refresh** → **Vercel Cron** hits a guarded `/api/cron/refresh-meta` endpoint daily.
  > NOTE: This replaces the architecture's always-on ARQ worker — Vercel has no long-running
  > processes, so the scheduled job runs as a cron-triggered serverless function instead.
- Branches: develop on `claude/lucid-feynman-ePNOd`; `main` is the Vercel production branch.

## Architecture principles
- **Engine + seed data are bundled client-side** → recommendations are instant and work offline.
- The **backend only handles what the browser can't**: the STRATZ token, rate-limited external
  calls (STRATZ/OpenDota/Steam), and the scheduled meta refresh. Never expose the STRATZ token client-side.
- Keep the engine **pure and deterministic** so it's trivially testable and reusable.

## Key flows
- **Recommend** (client-only): `scoreHero(candidate, team, enemy, bracketFactor)` = meta tier weight
  + hard-counters (±) + kit-tag edges + synergy + bracketFit (full ≤Archon, half Legend/Ancient, none Divine+).
- **Live track**: `GET /api/live/{handle}` → resolve handle (SteamID64 → 32-bit via `id - 76561197960265728`,
  or name → OpenDota `/search`) → STRATZ GraphQL `player(steamAccountId).liveMatch` (Bearer token) →
  return `{ radiant[], dire[], positions, gameTime }` → client maps onto board → engine re-scores.
- **Meta refresh** (Vercel Cron, daily): pull hero winrates by patch+bracket → compute tiers → store
  snapshot → served via `GET /api/meta?patch=&bracket=`. Replaces hand-tuned tiers; the **bracket overlay stays**.

## Data model (contracts)
```ts
Hero        { id; name; attr:'str'|'agi'|'int'|'uni'; roles:Role[]; tags:string[] }
MetaTier    { heroId; tier:'S'|'A'|'B'|'C'|'D'; note }
BracketFit  { heroId; w:number; note }            // low-bracket friendliness
Build       { heroId; key; path:string[]; note }  // item build path
Recommendation { hero; total; meta; reasons:{w;label}[] }
LiveMatch   { radiant:Hero[]; dire:Hero[]; positions?; gameTime }
```

## Conventions
- TypeScript strict everywhere. No `any`. Validate all external/API payloads with zod (web) / Pydantic (api).
- Engine functions are pure; side effects only in `apps/*`.
- Commit style: Conventional Commits. Small PR-sized commits per milestone task.
- Tests: vitest for `packages/engine`; pytest for `apps/api`. Don't finish a milestone without tests.
- Secrets via env only (`STRATZ_TOKEN`, `OPENDOTA_KEY?`, `STEAM_KEY?`); `.env.example` committed.

## Milestones (build in order)
- **M0 — scaffold**: pnpm+turbo workspace, `apps/web` (Vite), `apps/api` (uv/FastAPI), Biome+ruff, `vercel.json`, CI. ✅
- **M1 — extract**: port engine + data from the prototype into `packages/engine` + `packages/data` with zod schemas and vitest coverage. This is the foundation.
- **M2 — web**: rebuild the UI (pool / board with per-hero position / role+rank selectors / recs / expandable item builds) on top of `packages/engine`; TanStack Query against a mocked API. First Vercel deploy.
- **M3 — api**: FastAPI `/api/meta` (serve seed snapshot first), `/api/player/{id}`; httpx clients; pydantic-settings; pytest. Wire Python functions into Vercel.
- **M4 — live**: `steamid` util, `stratz` service, `GET /api/live/{handle}`, and the web Live-Import panel that autofills the board.
- **M5 — jobs**: Vercel Cron `refresh-meta` daily + Upstash Redis cache; swap hand-tuned tiers for computed tiers (keep bracket overlay).
- **M6 — ship**: secrets, README, deploy polish.

## External APIs
- **STRATZ** GraphQL `https://api.stratz.com/graphql` — Bearer token; per-player live match + winrates. Check the in-browser GraphQL explorer for exact `liveMatch` field names before coding M4.
- **OpenDota** REST `https://api.opendota.com/api` — `/search?q=`, `/players/{id}/recentMatches`, hero stats. Optional API key raises limits.
- **Steam Web API** — optional, persona/SteamID resolution.

## Definition of done (v1)
Enter pool + role + rank, type a live player's name/SteamID, and get a ranked carry pick with a
lineup-tuned build — backed by auto-refreshed 7.41c meta and bracket-aware weighting.
