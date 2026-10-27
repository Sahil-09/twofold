# Twofold — shared wishlist for two

Private app for exactly two people. Each person owns one wishlist; the partner browses it and can
claim items without the owner ever seeing the claim.

Stack: Next.js (App Router) + MongoDB Atlas (native driver) + Vercel. Installable PWA with web push.

## Decisions already made

| Question | Decision |
|---|---|
| Audience | Private instance, two seeded accounts. No signup, no tenancy UI. |
| Parsing | Server fetch → schema.org `Product` JSON-LD → OpenGraph fallback → editable draft before save. |
| List model | One shared list per person. No private/extra lists. |
| Item fields | url (optional), title, image, price snapshot, note, priority, quantity, occasion, target price, secret. |
| Price | Daily re-check, push alert when the target price is met. |
| Alerts | Web push (VAPID), no email. |
| Login | Per-user password, argon2 hash, Auth.js Credentials provider, JWT cookie. |
| Lifecycle | `wanted` → `archived`. "Bought" lives only in the hidden claim. |
| Priority | Four levels from the Stitch mock: `dream`, `high`, `essential`, `nice` (most wanted first). |
| Occasion | Free text plus optional date. A label, not an entity. |
| Secret items | Per-item vault flag: hidden from the partner, unclaimable, never announced. |
| Partner activity | In-app bell + `/activity` page, written only by item mutations; claims never write one. |
| UI | Mine / Theirs tabs, Activity, Settings. One mobile-first shell. |

## Data model (Mongo)

```
users        { _id, email, passwordHash, displayName, theme,
               notifyPartnerUpdates?, surpriseMode?, autoParse?, partnerSeenAt?, createdAt }
items        { _id, ownerId, url?, title, imageUrl?,
               price: { amount, currency, capturedAt }?,
               note?, priority: 'dream'|'high'|'essential'|'nice', quantity,
               occasion: { label, date? }?, secret?,
               targetPrice?, alertedAt?, status: 'wanted'|'archived',
               createdAt, updatedAt }
claims       { _id, itemId, claimantId, claimedAt, boughtAt?, archivedAt? }
activity     { _id, recipientId, actorId, kind: 'added'|'updated'|'archived',
               itemId, title, at, readAt? }
pushSubs     { _id, userId, endpoint, keys, createdAt }
priceChecks  { _id, itemId, checkedAt, price?, ok, error? }
```

Indexes: `items.ownerId + status`, `claims.itemId` (unique), `claims.claimantId`,
`pushSubs.userId`, `priceChecks.itemId + checkedAt`, `activity.recipientId + at`.

No price history table. The job overwrites `items.price`; a "drop" is
`newPrice <= targetPrice && !alertedAt`, then `alertedAt` is set so it fires once.

## Rules that must be enforced in one place

A single item-serialization helper decides what a viewer receives. Pages never build item payloads
by hand.

- You always see your own items. Claim data is not attached by default; only `surpriseMode: false`
  passes the viewer's own claim on their own list (and hides the opaque reservation tokens).
- You see your partner's items, including your claim on them (and only yours).
- Partner actions: create claim, mark bought, archive after giving.
- Owner actions: create, edit, delete, set target price, mark an item secret.
- Secret items are filtered out of the partner's list and their detail route, cannot be claimed, and
  write no activity. The one exception: a partner who claimed it before it was made secret keeps it.
- Owner-visible status moves to `archived` only when the partner archives. Marking bought changes
  nothing the owner can see — otherwise the surprise leaks at order time.
- Partner activity is written only from item create/update/archive. Claims and purchases never write
  one, so the bell cannot leak a surprise either.

## Parsing pipeline

1. Validate scheme is http/https, hostname non-empty, no credentials in URL.
2. Resolve DNS; reject loopback, private, link-local, and cloud-metadata ranges.
3. `fetch` with a browser UA, 8s timeout, max 2 redirects with the same checks each hop, 2MB body cap.
4. Parse: all `<script type="application/ld+json">` blocks → first `Product` node
   (`name`, `image`, `offers.price`, `offers.priceCurrency`). Fall back to `og:title`, `og:image`,
   `og:price:amount`, `product:price:amount`.
5. Return a draft; the user edits and confirms. Save happens on confirm, not on fetch.
6. On failure return "couldn't read this page" with empty fields — never block the add.

Images are hotlinked, not stored: plain `<img>`, `referrerpolicy="no-referrer"`, placeholder on error.

## Price job

- Vercel Cron, once daily.
- 40 items per run, concurrency 4, one `priceChecks` doc per item per run, per-item failures recorded
  and skipped.
- Push only when a target price is met and `alertedAt` is unset.
- `web-push` + VAPID keys from env. iOS requires the PWA to be added to the home screen (16.4+).

## Auth

- Hand-rolled: scrypt hashes (`lib/password.ts`) in `users`, and a `sessions` collection storing the
  sha256 of a random cookie token (`twofold_sid`, httpOnly, 30 days). No Auth.js, no argon2, no JWT.
- `npm run seed` creates the two accounts from `SEED_USER_A` / `SEED_USER_B` env
  (`email:password:DisplayName`).
- `npm run set-password <email>` is the reset path. No email sending anywhere.
- No signup route. Session gate in the layout; everything else requires a session.

## Screens

Three destinations, one mobile shell (fixed header + floating bottom nav).

- Mine: paste-a-link box at the top, cards with inline edit, target price, archive, delete.
  Cards show a "target hit" badge — it is your own target, so no leak. Secret items carry a lock chip.
- Both lists carry search (title, note, shop), a priority filter, and a sort (most wanted, newest,
  price). The partner's tab adds "planned by me / not planned", since it is the only side that has
  claim data. State lives in the URL (`?q=&priority=&state=&sort=`); counts and the vault keep using
  the unfiltered list, and price sorts only appear when every priced wish shares one currency.
- Theirs: cards with priority, quantity, occasion, and claim / mark-bought actions visible only to
  the claimant. No alert state on the partner's cards. Opening it clears the "new wishes" nav dot.
- Activity: what the partner added, edited or archived, with an unread count on the header bell.
  Opening it marks everything read.
- Settings: name, appearance (light/dark/system), and four working switches — Price Drop Alerts (this
  device's push subscription), Partner updates (`notifyPartnerUpdates`, silent when off), Surprise Mode
  (`surpriseMode`) and Automatic Link Scraper (`autoParse`). Every user-visible rule is a real toggle;
  no decorative "Always on" chips.
- Mobile-first layout, installable PWA, works on desktop.

## Files (rough)

```
app/layout.tsx           session gate + theme bootstrap
app/login/page.tsx       credentials form
app/page.tsx             Mine / Theirs tabs
app/activity/page.tsx    partner activity feed
app/settings/page.tsx    profile, appearance, real switches
app/actions/items.ts     create, update, delete, archive
app/actions/claims.ts    claim, mark bought, give
app/actions/parse.ts     URL → draft
lib/db.ts                Mongo client (cached across hot reloads)
lib/items.ts             queries, secret filter, priority order, seen watermark
lib/list.ts              search, filter and sort the serialized list in memory
components/ListControls.tsx  search box, filter and sort chips (URL-driven)
lib/view.ts              the serializer that hides claims
lib/activity.ts          activity rows + push fan-out
lib/auth.ts              scrypt sessions
lib/parse.ts             JSON-LD/OG extraction
lib/ssrf.ts              URL validation + IP range rejection
lib/push.ts              web-push wrapper
app/api/cron/price/route.ts
public/sw.js, public/manifest.webmanifest
scripts/seed.ts, scripts/migrate.ts, scripts/set-password.ts
```

## Build order

1. Scaffold, Mongo connection, seeded users, login, session gate.
2. Items CRUD + two tabs, manual fields only. Usable app, no parser.
3. Parser + SSRF guard + editable draft preview.
4. Claims and status transitions.
5. PWA manifest + service worker + push subscription.
6. Cron price job + target alerts.
7. Empty states, activity feed, settings, mobile pass.

## Tests

`npm test` (node --test, no database):

- Parser against fixtures: schema.org `Product`, OpenGraph fallback, product without an offer, no
  metadata, broken JSON-LD, European/thousands prices, Amazon gallery/offscreen fallbacks, title
  wrapper stripping, link-in-paste-text, title from URL.
- Serializer: an owner's payload has no claim fields; the secret flag is owner-only.
- Priority order/labels/icons, schema coercion (priority enum, checkbox, blank numbers, quantity
  bounds, date format).
- SSRF: `http://169.254.169.254/`, `http://localhost/`, public addresses, the 2MB read cap.

`npm run typecheck` and `npm run build` are the other gates. The browser pass (Playwright, kept
outside the repo) covers add/edit/delete, link parsing, claims, secrecy, activity, settings, themes
and the cron alert.

## Not in v1

Multi-couple signup, OAuth, email, price history charts, occasion reminders, variants
(size/colour), image storage, public share links, gift history.

## Known risks

- **Amazon and Flipkart will likely fail or return a wrong price.** JSON-LD is not their friend and
  they block datacenter IPs. Revisit before building the parser if most links come from there.
- **The URL fetcher is the only real attack surface** — it makes the server request arbitrary
  addresses. The SSRF guard is not optional.
- **A leaked claim breaks the product's point.** One serializer, one test, guarded against regress.
- **Mongo has no referential integrity.** Deleting a user or item means cleaning `claims`,
  `priceChecks`, `pushSubs` by hand. Irrelevant at two users.
- **Vercel Hobby cron is daily and approximate**, and function timeouts cap items per run. Fine for
  dozens of items; batch beyond that.
- **No password reset by email.** Losing the password means shelling into the box and running
  `set-password`.
