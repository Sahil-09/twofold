# Twofold

Two wishlists, one quiet place. Each person keeps one list; the other can reserve items without the
owner ever seeing which one. Full product and technical contract: [PLAN.md](./PLAN.md).

## Run it

```bash
npm install
cp .env.example .env.local     # then fill it in

npm run seed                              # creates the two accounts from SEED_USER_A/B
npm run set-password -- you@example.com "new password"

npm run dev
```

`SEED_USER_A` / `SEED_USER_B` use the format `email:password:Display Name`. Seeding is idempotent —
running it again resets those two passwords and display names.

To use a local database instead of Atlas, set `MONGODB_URI=mongodb://127.0.0.1:27017` and any
`MONGODB_DB` (the Windows MongoDB service is enough).

## Checks

```bash
npm run typecheck
npm test          # parser, SSRF ranges, claim-redaction, list filtering; no database needed
npm run build
```

## Deploy

Vercel, with `MONGODB_URI`, `MONGODB_DB`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT` and `CRON_SECRET` set. Generate the push keys with `npx web-push generate-vapid-keys`.

`vercel.json` runs `/api/cron/price` daily at 06:00 UTC; Vercel sends the `CRON_SECRET` as a bearer
token. On iPhone, push only works after adding the app to the Home Screen.

## Layout

- `app/` — routes and server actions. Login, the two-tab list, item detail, settings.
- `lib/` — `items` (queries + the only item serializer), `claims`, `parse` (JSON-LD/OpenGraph),
  `ssrf` (URL guard), `push`, `auth`, `password`, `schema` (zod).
- `scripts/` — seed and password reset, run directly by Node's TypeScript support.
- `tests/` — `node --test`, run with Node's built-in TypeScript stripping.
