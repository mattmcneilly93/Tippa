<div align="center">
  <h1>
    <span style="font-size: 3rem;">Tippa</span>
  </h1>
  <p>
    <strong>Private football prediction pools for friends, families, and teams.</strong>
  </p>
  <p>
    Rank group tables, predict knockout scores or winners, track leaderboards, and keep the pool private with invite codes.
  </p>
  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
    <img alt="Vercel" src="https://img.shields.io/badge/Vercel-ready-black?style=for-the-badge&logo=vercel" />
    <img alt="License" src="https://img.shields.io/badge/license-MIT-f7c948?style=for-the-badge" />
  </p>
</div>

## What It Does

Tippa is a tournament prediction pool app built with Next.js, Supabase, and Vercel. A group admin creates a private pool, picks the prediction format, shares an invite code, and members submit predictions before each phase locks.

The default game is intentionally simple:

- Group stage: rank each group table.
- Knockout stage: pick winners in the bracket, or predict knockout scores, after group play is done.
- Leaderboard: group-stage points + knockout points = total score.

Groups can also choose easier or harder formats:

- Rank final group tables.
- Pick group-stage match winners.
- Predict exact group-stage scores.
- Pick knockout winners in a full bracket or predict knockout scores.
- Optionally include the third-place match.
- Use scoring presets or custom point values.

The current tournament adapter targets the 2026 World Cup data from the openfootball JSON repository. Tournament data can be synced by cron, script, or manually from the group admin page.

## Features

- Google, Apple, and email magic-link login through Supabase Auth
- Private groups with invite codes
- Configurable prediction modes per group
- Group-stage lock at first tournament kickoff
- Admin-opened knockout prediction phase
- Full knockout winner bracket or knockout score prediction mode
- Configurable scoring presets plus advanced custom scoring
- Leaderboard breakdown for group-stage and knockout points
- Configurable prize modes: none, sponsored, buy-in, or hybrid
- Group-specific manual result overrides
- Admin-only manual tournament sync and score recalculation
- Daily Vercel Cron sync support
- Offline/PWA shell basics

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

### Testing on a Phone (ngrok tunnel)

`localhost` only works on the machine running the dev server, and magic-link
auth needs a stable, same-origin HTTPS URL to complete the PKCE flow. The
simplest way to test on a real phone is to expose the local dev server through
an [ngrok](https://ngrok.com) tunnel with a **static domain** (one free static
domain per account), so the callback URL never changes.

1. Sign in to ngrok and grab your reserved domain from
   [the dashboard](https://dashboard.ngrok.com/domains) (looks like
   `your-id.ngrok-free.app`), then authenticate the agent once:

   ```bash
   ngrok config add-authtoken <your-token>
   ```

2. Allow the tunnel host to load dev resources. In `next.config.ts`, add your
   domain to `allowedDevOrigins`:

   ```ts
   const nextConfig: NextConfig = {
     allowedDevOrigins: ["your-id.ngrok-free.app"]
   };
   ```

3. Point the app's canonical URL at the tunnel in `.env.development`:

   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-id.ngrok-free.app
   ```

4. In Supabase Auth → URL Configuration, set the **Site URL** to
   `https://your-id.ngrok-free.app` and add the callback to **Redirect URLs**:

   ```txt
   https://your-id.ngrok-free.app/auth/callback
   ```

5. Start the dev server, then the tunnel (in a second terminal):

   ```bash
   npm run dev
   ngrok http --url=https://your-id.ngrok-free.app 3000
   ```

6. On the phone, open `https://your-id.ngrok-free.app` in the browser, request a
   magic link, and open the emailed link **in the same browser** so the PKCE
   code verifier cookie matches.

The auth callback resolves its redirect origin from the `x-forwarded-host`
header, so logins completed through the tunnel return to the public URL rather
than `localhost`. When you go back to plain local development, revert
`NEXT_PUBLIC_SITE_URL` to `http://localhost:3000`.

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

### Database Reset Note

The prediction system uses mode-specific tables:

- `group_prediction_settings`
- `group_table_predictions`
- `match_predictions`
- `knockout_prediction_entries`

If you are upgrading from an older Tippa version, reset/recreate the Supabase database with the current `supabase/schema.sql`. Existing prediction data is not migration-compatible.

## Environment Variables

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe to expose to the browser. Supabase Row Level Security policies protect user data.

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
- Click **Recalculate scores** if you changed overrides or scoring.

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

## Prediction Flow

1. Admin creates a group and chooses the group-stage prediction mode.
2. Members submit group-stage predictions.
3. Group-stage predictions lock at the first group-stage kickoff.
4. Admin syncs tournament data after group play when knockout fixtures are known.
5. Admin opens knockout predictions.
6. Members pick knockout winners or scores before the first knockout kickoff.
7. Scores are recalculated after match results are synced or overridden.

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
