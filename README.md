# Tippa

Tippa is a private football prediction pool app built with Next.js, Supabase, and Vercel. It lets a small group create a tournament pool, invite members with a code, submit score predictions, track points, and optionally configure prizes.

The current tournament adapter targets the 2026 World Cup data from the openfootball JSON repository. Tournament data can be synced by cron or manually from a group admin page.

## Features

- Google, Apple, and email magic-link login through Supabase Auth
- Private groups with invite codes
- Prediction entry per match
- Leaderboard scoring
- Configurable prize modes: none, sponsored, buy-in, or hybrid
- Group-specific manual result overrides
- Admin-only manual tournament sync
- Daily Vercel cron sync support
- Offline/PWA basics

## Stack

- Next.js App Router
- React
- Supabase Auth and Postgres
- Tailwind CSS
- Vercel Cron Jobs
- Vitest for scoring tests

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.development
```

Fill in:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
CRON_SECRET=
```

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

The dev script uses Webpack because this project hit a Turbopack proxy issue during local development.

## Supabase Setup

1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql`.
3. Enable the auth providers you want under Supabase Auth.
4. Add local and production callback URLs in Supabase Auth URL Configuration:

```txt
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

For Google and Apple OAuth, the provider callback URL registered in Google/Apple should be the Supabase callback:

```txt
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

## Environment Variables

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe to expose to the browser. Supabase Row Level Security policies are what protect user data.

Keep these secret:

- `SUPABASE_SECRET_KEY`
- `CRON_SECRET`
- OAuth client secrets
- Apple `.p8` private keys

Do not commit `.env.development`, `.env.production`, or `.env*.local`.

## Syncing Tournament Data

Manual sync:

- Log in as a group admin.
- Open the group admin page.
- Click **Sync now**.

Script sync:

```bash
npm run sync:tournament
```

Sync one tournament:

```bash
npm run sync:tournament -- world-cup-2026
```

Cron sync:

`vercel.json` defines a daily sync route:

```txt
/api/cron/sync-tournaments
```

Vercel Hobby cron is limited to once per day. For more frequent automated syncs, use Vercel Pro or an external scheduler that can call the cron route with:

```txt
Authorization: Bearer <CRON_SECRET>
```

## Deployment

Deploy to Vercel as a Next.js project.

Set production environment variables in Vercel:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
CRON_SECRET=
```

Use:

```bash
npm run build
```

as the build command.

## Scripts

```bash
npm run dev              # start local dev server with Webpack
npm run dev:turbo        # start local dev server with Turbopack
npm run build            # production build
npm run start            # start production server
npm run lint             # run ESLint
npm run test             # run Vitest tests
npm run sync:tournament  # sync tournament data
```

## License

MIT. See `LICENSE`.
