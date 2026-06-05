<div align="center">

# ⚔️ Draft Oracle

**A Dota 2 draft assistant that tells you which carry to pick — and how to play it.**

Pick from *your* hero pool for *your* role and rank, drop in the enemy lineup, and get a
ranked recommendation with a lineup-tuned item build, real win-rate matchups, and an
adaptive coaching panel — instantly, in the browser.

[Live demo](https://dota-oracle.vercel.app) · [Coach flow mockup](mockups/coach-flow.html) · [Architecture & milestones](CLAUDE.md)

<!-- Update the live-demo link above with your own Vercel domain. -->

![React](https://img.shields.io/badge/React-18-3f8fd1)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11+-74b13f)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)
![Tests](https://img.shields.io/badge/tests-52_JS_·_31_API-c79a45)

</div>

---

## ✨ What it does

| | Feature | Notes |
|---|---|---|
| 🎯 | **Smart pick recommendations** | Ranks your pool for your role by 7.41d meta tier, counters, kit-tag matchups, synergy, and **rank-bracket** weighting. |
| 🪙 | **Lineup-tuned item builds** | Core path per hero + situational items computed from the enemy's threats (BKB vs magic, MKB vs evasion, cleave vs illusions…). |
| 📊 | **Real win-rate matchups** | Pulls actual hero-vs-hero win rates (OpenDota) for the enemies on the board and folds them into the score — falls back to bundled counters offline. |
| 🤖 | **Adaptive AI coach** | A panel that **reconfigures itself** per lineup — surfacing the right advice modules. Uses Chrome's **on-device** Gemini Nano when available, with a deterministic rule-based tier everywhere else. |
| 🗣️ | **Voice dictation** | Say *"wraith king, lion, crystal maiden"* to fill the board. Handles nicknames, mishears, and spacing (Chrome/Edge). |
| 🖼️ | **Official hero icons** | Real Dota portraits with a graceful initials fallback. |
| 📥 | **Match import** | Type a Steam name/ID to auto-fill the board from a player's most recent match (STRATZ). |
| ⚡ | **Instant & offline** | The scoring engine + seed data are bundled client-side, so core recommendations are instant and work with no network. |

> The engine is **deterministic and the source of truth** — the AI coach only explains and
> arranges advice, it never changes a score.

---

## 🚀 Quick start

**Prerequisites:** Node ≥ 20 + [pnpm](https://pnpm.io) 10 (`corepack enable`). For the backend, Python ≥ 3.11 + [uv](https://docs.astral.sh/uv/).

```bash
git clone https://github.com/jnebab/dota-oracle.git
cd dota-oracle
pnpm install
pnpm dev            # runs everything via Turborepo
```

Just the web app (no backend needed for core recommendations):

```bash
pnpm --filter web dev      # → http://localhost:5173
```

The backend (only needed for match import / live matchups / meta refresh):

```bash
cd apps/api
uv sync
uv run uvicorn app.main:app --reload    # → http://localhost:8000
```

---

## 🧠 How it works

```
        You (pool · role · rank · board)
                     │
                     ▼
   ┌──────────────────────────────────────────────┐
   │  packages/engine  (pure TS, bundled, offline) │
   │  scoreHero() = meta tier + counters + matchups │
   │  + kit-tag edges + synergy + bracket overlay   │
   └───────────────┬───────────────┬───────────────┘
                   │               │
                   ▼               ▼
        ranked picks +      packages/coach → adaptive
        item builds         coaching panel (rules / AI)
                   │
                   ▼  (only what the browser can't do)
   ┌──────────────────────────────────────────────┐
   │  apps/api  (FastAPI on Vercel functions)       │
   │  /api/matchups · /api/recent · /api/meta · cron │
   │  holds the STRATZ token, calls OpenDota/STRATZ  │
   └──────────────────────────────────────────────┘
```

**Core principle:** the engine and seed data ship *inside the client*, so recommendations are
instant and work offline. The backend only does what a browser can't — hold the STRATZ token,
make rate-limited external calls, and run the scheduled meta refresh.

---

## 🧩 Project structure

```
dota-oracle/
├─ apps/
│  ├─ web/                 # Vite · React 18 · TS · Tailwind · TanStack Query
│  │  └─ src/coach/        #   on-device AI hook (Chrome Prompt API)
│  └─ api/                 # FastAPI · Python (uv) → Vercel Python functions
├─ packages/
│  ├─ engine/             # pure TS scoring: scoreHero, buildGuide, parseHeroes …
│  ├─ data/               # heroes/counters/synergies/builds/meta/icons + zod
│  └─ coach/              # adaptive coaching modules (rules + AI-output validator)
├─ prototype/              # original single-file prototype (reference)
├─ mockups/                # design storyboards (e.g. the coach flow)
└─ turbo.json · pnpm-workspace.yaml · vercel.json · CLAUDE.md
```

---

## 🔌 API reference

All routes are served under `/api/*` (Vercel Python functions). None are required for the core advisor.

| Route | Purpose | Needs |
|---|---|---|
| `GET /api/health` | Liveness probe | — |
| `GET /api/meta?patch=&bracket=` | Meta tier snapshot (computed in Redis, else bundled seed) | — / Upstash |
| `GET /api/matchups?vs=slug,slug` | Win-rate advantage vs the listed enemy heroes | OpenDota |
| `GET /api/player/{id}` | Recent-match overview + top heroes | OpenDota |
| `GET /api/recent/{handle}` | Resolve a name/SteamID → their last match lineup | STRATZ token |
| `GET /api/cron/refresh-meta` | Recompute meta tiers → Redis (Vercel Cron, bi-weekly) | Upstash + `CRON_SECRET` |

---

## ⚙️ Configuration

Copy `.env.example` → `.env` and fill in only what you need. **The core advisor needs none of these.**
Secrets are **server-side only** — never commit them or expose them to the client bundle.

| Variable | Required for | Notes |
|---|---|---|
| `STRATZ_TOKEN` | Match import | Free token from [stratz.com](https://stratz.com) → API. |
| `OPENDOTA_KEY` | — (optional) | Raises OpenDota rate limits; matchups/player work without it. |
| `STEAM_KEY` | — (optional) | Persona/SteamID resolution. |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Meta refresh cache | Free [Upstash](https://upstash.com) Redis. |
| `CRON_SECRET` | Cron auth | Any random string; Vercel sends it to the cron endpoint. |
| `VITE_API_BASE` | Web (optional) | API base URL; empty = same-origin `/api`. |

---

## 🌐 Browser support & on-device AI

- **Everything core** works in any modern browser, offline.
- **Voice dictation** needs the Web Speech API → **Chrome, Edge, Android Chrome**.
- **AI coach tier** needs Chrome's built-in **Prompt API (Gemini Nano)**. Without it, the coach
  runs an identical adaptive panel via the deterministic **rule-based** tier.

<details>
<summary><b>Enable the on-device AI coach (Chrome)</b></summary>

1. `chrome://flags` → set **`#optimization-guide-on-device-model`** = *Enabled BypassPerfRequirement*
   and **`#prompt-api-for-gemini-nano`** = *Enabled*. Relaunch Chrome.
2. `chrome://components` → **Optimization Guide On Device Model** → *Check for update* (downloads ~1–2 GB).
3. Reload the app. The coach chip flips to **⚡ on-device AI** (or shows an *Enable on-device AI* button).

Verify in DevTools console: `await LanguageModel.availability()`. Requires desktop Chrome, ~22 GB free disk, and a >4 GB GPU.
</details>

---

## 🛠️ Development

```bash
pnpm dev          # all dev servers (Turborepo)
pnpm build        # build everything
pnpm test         # unit tests (vitest) — engine, data, coach
pnpm typecheck    # strict TS across all packages
pnpm lint         # Biome lint + format check
pnpm format       # Biome write

# backend
cd apps/api
uv run pytest         # API tests
uv run ruff check .   # lint
```

**Conventions:** TypeScript strict, no `any`; external/API payloads validated with **zod** (web) /
**Pydantic** (api); engine/data/coach packages are **pure** (no React, no IO); Conventional Commits.
CI (GitHub Actions) runs lint, typecheck, tests, and build on every push.

---

## ☁️ Deployment

Runs entirely on **Vercel** (free Hobby tier):

- `apps/web` → static build served at the root.
- `apps/api` → Python serverless functions under `/api/*` (see `vercel.json`).
- **Meta refresh** → a bi-weekly **Vercel Cron** job hitting `/api/cron/refresh-meta`.
- **Cache** → Upstash Redis.

`main` is the Vercel production branch — pushing to it triggers a deploy. Add the env vars above in
the Vercel dashboard to light up match import, matchups, and the meta refresh.

---

## 📦 Tech stack

**Web** React 18 · TypeScript · Vite · Tailwind · TanStack Query · zod ·
**Engine/Data/Coach** pure TypeScript (vitest) ·
**API** FastAPI · Pydantic v2 · httpx · uv ·
**Infra** Vercel · Upstash Redis ·
**Tooling** pnpm workspaces · Turborepo · Biome · ruff ·
**Data** STRATZ · OpenDota · on-device Gemini Nano (Chrome).

See [`CLAUDE.md`](CLAUDE.md) for the full architecture, data contracts, and build milestones.
