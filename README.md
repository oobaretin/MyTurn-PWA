# MyTurn

Mobile-first PWA for fair evening shower and morning school-ready turns. Share a link with each kid; they get notifications and a full-screen alarm when it's their turn.

**Rules**

- Evening shower order rotates daily.
- Whoever showers first in the evening leads the next morning's get-ready order.
- Tap **Done** to notify the next sibling. Cron also nudges at scheduled slot times.

## Deploy on Vercel

1. Push this repo and import in [Vercel](https://vercel.com).
2. Add a Postgres database (Neon or Vercel Postgres) and set `DATABASE_URL`.
3. Run the SQL in [`db/migrate.sql`](db/migrate.sql) against your database.
4. Generate VAPID keys:

   ```bash
   npx web-push generate-vapid-keys
   ```

   Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` (e.g. `mailto:you@example.com`).

5. Set `CRON_SECRET` to a long random string. Vercel Cron (see [`vercel.json`](vercel.json)) hits `/api/cron/tick` each minute; with `CRON_SECRET` in env, Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.

6. Deploy.

## Local development

```bash
cp .env.example .env.local
# Paste a Postgres URL into DATABASE_URL (Neon free tier works well)
npm install
npm run db:migrate
npm run dev
```

**Neon (free):** create a project at [neon.tech](https://neon.tech) → **Connect** → copy the connection string (use * pooled* or *direct*; include `?sslmode=require` if Neon omits it). Paste into `.env.local` as `DATABASE_URL`, then run `npm run db:migrate`.

Open [http://localhost:3000](http://localhost:3000), create a household, and copy kid links from parent setup.

## Kid phones (especially iPhone)

1. Open their personal link in **Safari**.
2. Tap **Turn on notifications** and allow alerts.
3. **Share → Add to Home Screen** (required for reliable Web Push on iOS 16.4+).
4. Open MyTurn from the home screen icon.

Android: open the link in Chrome, allow notifications, and install when prompted.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build (includes service worker)
- `npm test` — rotation logic unit tests

## Parent setup

- `/h/<householdId>/setup` — schedule, kid links, skip turn
- `/h/<householdId>/today` — family board

Save the household ID from the URL after creation so you can return to setup later.
