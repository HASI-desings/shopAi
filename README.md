# Meeru.shop (Appwrite edition)

AI retail-intelligence API. Next.js 14 · Tailwind · **Appwrite Cloud** (Auth + Databases) · Anthropic Claude · Zod · Vercel.
Everything is done from a browser; no terminal needed.

## 1. Appwrite console (project `6a632cec0020e9021e91`)
1. **Overview → Integrations → API keys → Create API key.** Name it `meeru-server`, no expiry, and tick these scopes:
   `users.read, users.write, sessions.write, databases.read, databases.write, collections.read, collections.write, attributes.read, attributes.write, indexes.read, indexes.write, documents.read, documents.write`.
   Copy the secret once. It is the `APPWRITE_API_KEY`. Never share it or commit it.
2. **Overview → Platforms → Add platform → Web.** Add each hostname you use: `meeru.shop`, your `*.vercel.app` hostname, and `localhost` if you develop locally. Without this, verification and password-reset emails fail.
3. Auth → Settings: leave Email/Password enabled.

## 2. GitHub and Vercel
1. Upload this project to a new GitHub repo (keep the folder structure).
2. Import it in Vercel. Add the env vars from `.env.example`. `SETUP_TOKEN` can be any long random string. Deploy.
3. Add the `meeru.shop` domain in Vercel and set the DNS records it shows.

## 3. Create the database ("migration")
Open `https://YOUR-DOMAIN/api/setup?token=YOUR_SETUP_TOKEN` in Safari. It creates the database `meeru`, six collections, their attributes and indexes. Attributes build asynchronously, so if the page says `"done": false`, wait 10 seconds and reload until `"done": true`. It is safe to run repeatedly. Then **delete `SETUP_TOKEN` in Vercel and redeploy** to switch the route off.

Collections: `counters` (quota, rate limits, locks) · `projects` · `api_keys` (hash only) · `api_usage` · `subscriptions` (`owner_id, plan_id, status`; add a document to put a user on `developer` or `business`) · `audit_logs`. They have no client permissions, so only the server key can read them.

## How it differs from the Supabase version
- Auth: server-side Appwrite sessions in an httpOnly cookie. Sign-up, sign-in, email verification, password reset and sign-out go through `/api/auth/*`.
- Quota: Appwrite has no transactions, so quota updates use a per-user mutex built on unique document IDs (`lib/quota.ts`). Per-key rate limiting is best-effort.
- Plans live in `lib/plans.ts` (`LIMITS`).
- Creating API keys requires a verified email.

## Not implemented / not verified
Payments, account deletion, profile editing, OpenAPI file, Playwright tests, cleanup of old `api_usage`/rate documents. **Nothing has been run against live Appwrite or Anthropic yet.** Expect to fix small issues on first deploy (check Vercel build logs and the `/api/setup` log).
