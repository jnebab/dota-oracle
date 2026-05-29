# Draft Oracle

A Dota 2 **draft + live-match advisor**. Give it your hero pool, role, and rank plus the
ally/enemy lineup, and it ranks which carry to pick — weighted by the current-patch (7.41c)
meta, counters/synergy, and your rank bracket — then generates a lineup-tuned item build for
each suggestion. It can also pull a *live* game off STRATZ by name or SteamID and auto-fill
the board.

The scoring engine and seed data are bundled **client-side**, so recommendations are instant
and work fully offline. A small FastAPI backend handles only what the browser can't: the STRATZ
token, rate-limited external calls, and the scheduled meta refresh.

## Monorepo layout

```
dota-oracle/
├─ apps/
│  ├─ web/          # Vite · React 18 · TS · Tailwind · TanStack Query
│  └─ api/          # FastAPI · Python (uv) → Vercel Python functions
├─ packages/
│  ├─ engine/       # pure TS scoring: scoreHero, tagEdges, buildGuide … (vitest)
│  └─ data/         # heroes/counters/synergies/builds/meta + zod schemas
├─ prototype/       # original single-file prototype (reference)
├─ turbo.json · pnpm-workspace.yaml · vercel.json · CLAUDE.md
```

## Prerequisites

- Node ≥ 20 and [pnpm](https://pnpm.io) 10 (`corepack enable`)
- For the backend: Python ≥ 3.11 and [uv](https://docs.astral.sh/uv/)

## Getting started

```bash
pnpm install          # install JS workspace deps
pnpm dev              # run all dev servers (turbo)
pnpm build            # build everything
pnpm test             # run unit tests (vitest)
pnpm typecheck        # type-check all packages
pnpm lint             # Biome lint/format check
```

The web app alone:

```bash
pnpm --filter web dev
```

## Configuration

Copy `.env.example` to `.env` and fill in values as needed. **The core draft advisor needs
none of these** — they only power the backend (live import, meta refresh). See `.env.example`
for the full list. Secrets (e.g. `STRATZ_TOKEN`) are **server-side only** and must never be
committed or exposed to the client bundle.

## Deployment

Deployed entirely on **Vercel** (free Hobby tier):

- `apps/web` → static build served at the root.
- `apps/api` → Python serverless functions under `/api/*`.
- Meta refresh → a daily **Vercel Cron** job (replaces an always-on worker).
- Cache → **Upstash Redis** (free tier).

`main` is the Vercel production branch. See `CLAUDE.md` for the full architecture and milestones.
