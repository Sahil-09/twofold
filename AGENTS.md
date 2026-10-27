# AGENTS.md

## State of the repo

Built and working: Next.js 16 app, MongoDB via the native driver, seeded two-account login, item CRUD,
claims, parser, search/filter/sort on both lists, PWA push and the daily price job. `PLAN.md` is the
product contract; this file is the working notes. Read `PLAN.md` before changing behaviour.

No git repo is initialised. Ask before running `git init`, committing, or adding hooks.

```bash
npm run dev          # localhost:3000, reads .env.local
npm run typecheck
npm test             # node --test, no database needed
npm run build
npm run seed         # idempotent; resets the two accounts' passwords + names
npm run migrate      # idempotent; must→dream, seen watermark, activity index
npm run set-password -- email "new password"
```

A local MongoDB service is usually running on `127.0.0.1:27017`; `.env.local` points at it with
`MONGODB_DB=twofold_dev`. Atlas/Vercel env vars are listed in `.env.example`.

## Fixed stack (settled in PLAN.md, don't re-litigate)

- Next.js App Router, server actions for mutations, no separate API layer.
- MongoDB with the **native driver**, not Mongoose. Zod at every trust boundary.
- Auth is hand-rolled: scrypt hashes (`lib/password.ts`) and a `sessions` collection holding the
  sha256 of a random cookie token (`lib/auth.ts`). Not Auth.js, not argon2 — no native build step and
  no beta dependency. Accounts come from `npm run seed`; `npm run set-password` is the reset path.
- Vercel + Vercel Cron (daily). PWA + `web-push` for alerts.

## Invariants that are easy to break

1. **Claim data never reaches the item owner by default.** `lib/view.ts` holds the only item
   serializer (`ownerView` / `toView`); no page assembles items by hand. With Surprise Mode on (the
   default) the owner's list carries `reservations: string[]` of opaque tokens only — no item id,
   title, price, image, or count-per-item. The one exception is `users.surpriseMode === false`, where
   `getList` passes the owner's own claim (no claimant id) and the tokens disappear. Never invert that
   default.
2. **Owner-visible status never flips on purchase.** `bought_at` lives on the claim and stays hidden.
   An item becomes `archived` only when the partner archives it after giving it.
3. **Every outbound URL fetch goes through `lib/ssrf.ts`** — scheme allowlist, DNS resolve and reject
   loopback/private/link-local/metadata, re-check each redirect hop, 8s timeout, 2MB body cap. This is
   the app's only real attack surface; do not bypass it "just for the parser".
4. **No signup route.** A `/login` page and `requireUser()` in every page, nothing else. The layout
   reads the theme cookie, never the user row.
5. **Secret items stay secret.** `secret` is filtered in `getList`, hidden in `toView`, refused in
   `claims.ts`, and suppresses activity. The only exception is a partner who claimed it before the
   flag was set. Do not "fix" that filter into a client-side check.
6. **A claim never writes activity.** `recordActivity` is called from item create/update/archive
   only. The bell, the nav dot and `/activity` are all computed from that: no claim, no purchase, no
   `given` may show up there.

## Performance

A tap must paint immediately and cost as few database round trips as possible, because the function
and the database are only fast when they are in the same region.

- `app/layout.tsx` reads the theme from the `twofold_theme` cookie (`lib/theme.ts`), so it never
  queries. Login and the theme picker write that cookie.
- `app/loading.tsx` is the skeleton the router paints while the page streams. Without it, dynamic
  routes are not prefetched at all and every tap waits for a full server render.
- `getCurrentUser` is wrapped in React `cache()`, and pages `Promise.all` the partner, the list, the
  new-wish check and the bell count. Never add a serial `await` before those.
- The Vercel function region must match the Atlas cluster region (Mumbai, `bom1`, `ap-south-1`).
  A cross-region pair adds ~200 ms to every query and there are ~5 per navigation.

## Design

Stitch project `projects/7144019034590046869` ("Couples Wishlist App"), design system
*Warm Romantic Editorial*. Read it with the `stitch` MCP tools; the API key lives in
`opencode.json` — never copy it into code, docs, or `.env`.

- Tokens (colours, type scale, radii, shadows) go into `globals.css` as CSS variables for light and
  `.dark`, mapped through Tailwind `@theme`. No hard-coded hex in components.
- Light and dark both ship in v1; the toggle lives in Settings and defaults to system.
- Stitch screens are **reference only**. `download_file` gives static HTML — rebuild as React
  components, never paste it into the app.

## Scope guard

Out of v1, do not build unless asked: multi-couple signup, OAuth, email/password-reset email, PDF
export, split-screen dashboard, price history charts, occasion reminders, size/colour variants,
image storage (images are hotlinked), public share links, gift history.

## Known failure modes

- JSON-LD parsing will fail or return a wrong price on Amazon and Flipkart. Treat parse failure as a
  normal state with editable fields, never as a blocker.
- Vercel Hobby cron is daily and approximate, and function timeouts cap items per run — batch the
  price check rather than looping the whole list.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
