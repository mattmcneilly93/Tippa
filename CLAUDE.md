# CLAUDE.md — Tippa (World Cup 2026 prediction pool)

## Context
This is an existing open-source app (williamsaether/Tippa), MIT-licensed, already cloned. The goal is to get it **running locally** for a private World Cup 2026 pool among friends, and later restyle it to the **mmmagasin** brand.

**Do NOT rewrite or re-architect it.** Work within the existing codebase, make the smallest changes needed to run it, and preserve its structure and conventions.

## Stack (as-is — do not change)
- Next.js (App Router) + React + TypeScript
- Supabase (Auth + Postgres), Row Level Security for data protection
- Tailwind CSS + shadcn/ui (`components.json`)
- Vercel (hosting + daily Cron sync)
- Vitest for scoring tests
- Tournament data via an openfootball JSON adapter (target: `world-cup-2026`) — so teams/fixtures are synced, never hardcoded

## What it does (domain context)
- An admin creates a private group, picks a prediction mode, and shares an invite code.
- Group stage: members rank each group table (default mode), or pick winners / predict exact scores. Locks at the first group-stage kickoff.
- Knockout: admin opens the phase after group play; members pick winners or scores.
- Leaderboard = group-stage points + knockout points.
- Prediction tables: `group_prediction_settings`, `group_table_predictions`, `match_predictions`, `knockout_prediction_entries`.

## Runtime
- Node: use 20 LTS or newer. Check `package.json` engines and Next.js's requirement before running; use `nvm` if a switch is needed.
- Package manager: npm (`package-lock.json` present).
- Dev server: `npm run dev` runs on **Webpack** — the README notes a Turbopack proxy issue. A `npm run dev:turbo` script exists; avoid it.

## Environment variables (`.env.development`)
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=                # from Paolo's Supabase project
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=    # public-safe (publishable/anon)
SUPABASE_SECRET_KEY=                     # SECRET — Paolo provides; never hardcode or commit
CRON_SECRET=                             # SECRET — any strong random string
```
- `NEXT_PUBLIC_*` are browser-safe; RLS protects user data.
- `SUPABASE_SECRET_KEY` and `CRON_SECRET` are secret.
- Never commit `.env.development`, `.env.production`, or `.env*.local` (already gitignored).

## Human-only steps (you, Claude Code, must NOT do these)
You cannot create accounts, log in, or enter credentials/secrets. These belong to Paolo:
1. Create a Supabase project (supabase.com).
2. Copy the Project URL + publishable key + secret key into `.env.development`.
3. In the Supabase SQL editor, run the contents of `supabase/schema.sql`.
4. Under Supabase Auth, enable the Email (magic-link) provider. (Google/Apple optional — skip for the first run.)
5. Add the callback URL `http://localhost:3000/auth/callback` in Supabase Auth -> URL Configuration.

When you reach a step that needs these, **pause, print a clear checklist, and wait.**

## What you CAN do autonomously
- `npm install`
- Create `.env.development` from `.env.example` with placeholders (no real secrets)
- Generate a strong random `CRON_SECRET` and put it in `.env.development`
- `npm run lint` and `npm run test` (Vitest) to confirm the codebase is healthy out of the box
- After Paolo confirms Supabase is set up: `npm run dev`, then verify `http://localhost:3000` loads
- `npm run build` to confirm a clean production build
- Sync data only AFTER Supabase is connected: `npm run sync:tournament -- world-cup-2026` (or tell Paolo to use the admin "Sync now" button)

## Later (separate task — not now): mmmagasin theming
Restyling lives in the Tailwind theme, `globals.css`, and shadcn/ui tokens. Do not touch these during install/build. When asked, point out where the design tokens are.

## Working style
- Smallest-diff approach. Don't refactor working code.
- After install + env scaffold + tests, STOP and hand Paolo the human-only checklist. Resume only after he confirms.
- Surface any version mismatch, build error, or missing dependency **verbatim** rather than guessing or working around it.
