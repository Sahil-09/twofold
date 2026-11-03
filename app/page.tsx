import { markPartnerSeenAction } from "@/app/actions/settings";
import { AddWish } from "@/components/AddWish";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { Icon, Pulse } from "@/components/icons";
import { ItemCard } from "@/components/ItemCard";
import { ListControls } from "@/components/ListControls";
import { OnMount } from "@/components/OnMount";
import { Reservations } from "@/components/Reservations";
import { unreadActivityCount } from "@/lib/activity";
import { getPartner, requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { getList, partnerHasNew } from "@/lib/items";
import { applyList, singleCurrency, type ListSort, type ListState } from "@/lib/list";
import { PRIORITY_ORDER } from "@/lib/priority";
import type { Priority } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SORTS: ListSort[] = ["wanted", "newest", "priceAsc", "priceDesc"];

/** A repeated `?q=a&q=b` arrives as an array; the first value is enough. */
const single = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  // The partner, the URL and the bell are independent, so they share one round of waiting.
  const [partner, params, unread] = await Promise.all([
    getPartner(user.id),
    searchParams,
    unreadActivityCount(user.id),
  ]);
  const tab = single(params.tab);
  const q = single(params.q);
  const rawPriority = single(params.priority);
  const rawState = single(params.state);
  const rawSort = single(params.sort);
  const theirs = tab === "theirs" && partner !== null;
  const partnerReveals = theirs && partner?.surpriseMode === false;
  const [list, hasNew] = await Promise.all([
    getList(user.id, theirs && partner ? partner.id : user.id, !theirs && user.surpriseMode === false),
    partner && user.notifyPartnerUpdates ? partnerHasNew(partner.id, user.partnerSeenAt) : false,
  ]);
  const owner = theirs && partner ? partner.displayName : user.displayName;
  const firstCurrency = list.items.find((item) => item.price)?.price?.currency;
  const total = list.items.reduce((sum, item) => sum + (item.price?.amount ?? 0), 0);
  const reserved = list.items.filter((item) => item.claim).length;

  // Price sorts need one currency, or "cheapest" compares rupees with dollars.
  const currency = singleCurrency(list.items);
  const priority: Priority | "all" = PRIORITY_ORDER.find((value) => value === rawPriority) ?? "all";
  // The owner has no claim data by default, so that filter only means something on the partner's tab.
  const state: ListState =
    theirs && (rawState === "planned" || rawState === "unplanned") ? rawState : "all";
  const requested: ListSort = SORTS.find((value) => value === rawSort) ?? "wanted";
  const sort: ListSort = !currency && requested.startsWith("price") ? "wanted" : requested;
  const shown = applyList(list.items, { q, priority, state, sort });

  return (
    <>
      <Header user={user} section={theirs ? "Partners List" : "My List"} unread={unread} />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16">
        <div className="flex flex-col gap-6 pb-4 pt-3">
          {theirs ? <OnMount action={markPartnerSeenAction} /> : null}
          {theirs ? (
            <>
              <div className="relative overflow-hidden rounded-3xl bg-secondary-fixed p-5 shadow-rest">
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-lowest/80 px-2.5 py-0.5 text-secondary backdrop-blur-sm">
                      <Icon name={partnerReveals ? "eye" : "lock"} className="h-3.5 w-3.5" />
                      <span className="text-label-sm font-semibold uppercase tracking-wider">
                        {partnerReveals ? "Surprise Mode Off" : "Secret Gifting Mode"}
                      </span>
                    </span>
                    <span className="flex min-w-0 items-center gap-1 text-on-secondary-fixed-variant">
                      <Icon
                        name={partnerReveals ? "eye" : "eyeOff"}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span className="hidden truncate text-label-sm font-medium sm:inline">
                        {partnerReveals
                          ? `${owner} can see your claims`
                          : `${owner} sees zero traces`}
                      </span>
                    </span>
                  </div>
                  <div className="pt-2">
                    <h1 className="text-headline-lg-mobile font-bold tracking-[-0.015em] text-on-secondary-fixed">
                      {owner}&apos;s Wishlist
                    </h1>
                    <p className="mt-0.5 flex items-center gap-1 text-body-md text-on-secondary-fixed-variant">
                      {partnerReveals
                        ? `${owner} can see which wishes you reserved or bought.`
                        : `Surprises are safe — ${owner} cannot see your purchase status.`}
                      {partnerReveals ? null : <span aria-hidden>🤫</span>}
                    </p>
                  </div>
                </div>
                <div className="pointer-events-none absolute -bottom-10 -right-8 h-36 w-36 rounded-full bg-primary-fixed/40 blur-2xl" />
                <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-secondary-container/30 blur-xl" />
              </div>

              <div className="flex items-center justify-between rounded-full bg-surface-lowest px-4 py-3 shadow-rest">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-fixed text-primary">
                    <Icon name="gift" className="h-3.5 w-3.5" />
                  </span>
                  <p className="truncate text-label-md text-on-surface">
                    <span className="font-bold text-primary">
                      {reserved} {reserved === 1 ? "item" : "items"} reserved
                    </span>{" "}
                    by you • {partnerReveals ? `visible to ${owner}` : "Secret surprises safe"}
                  </p>
                </div>
                <Icon name="checkCircle" className="ml-2 h-4 w-4 shrink-0 text-primary" />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-headline-lg-mobile font-semibold tracking-[-0.015em]">
                    {user.displayName}&apos;s Wishlist
                  </h1>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <p className="text-label-sm text-outline">
                      Synced with {partner?.displayName ?? "your partner"}
                    </p>
                  </div>
                </div>
                <div className="rounded-full bg-surface-low px-3 py-1.5">
                  <span className="text-label-sm font-medium text-on-surface-variant">
                    {list.items.length} {list.items.length === 1 ? "wish" : "wishes"} saved
                    {total > 0 ? ` • ${money(total, firstCurrency)} total` : ""}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!partner ? (
            <p className="card p-5 text-body-md text-on-surface-variant">
              Only one account exists. Run <code>npm run seed</code> with two users to pair the lists.
            </p>
          ) : null}

          {!theirs ? (
            <AddWish
              partnerName={partner?.displayName}
              wishCount={list.items.length}
              reservedCount={Math.max(list.reservations.length, reserved)}
              autoParse={user.autoParse}
            />
          ) : null}

          {list.items.length > 0 ? (
            <ListControls
              total={list.items.length}
              shown={shown.length}
              q={q ?? ""}
              priority={priority}
              state={state}
              sort={sort}
              showState={theirs}
              showPriceSort={Boolean(currency)}
            />
          ) : null}

          {list.items.length === 0 ? (
            <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
              <Icon name="gift" className="h-8 w-8 text-outline-variant" />
              <p className="text-title-md font-semibold">
                {theirs ? "Their list is still empty" : "Nothing on your list yet"}
              </p>
              <p className="max-w-xs text-body-md text-on-surface-variant">
                {theirs
                  ? "Give them a nudge — or start dropping hints on yours."
                  : "Paste a link above, or add something you spotted in a shop."}
              </p>
            </div>
          ) : shown.length === 0 ? (
            <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
              <Icon name="search" className="h-8 w-8 text-outline-variant" />
              <p className="text-title-md font-semibold">No wishes match</p>
              <p className="max-w-xs text-body-md text-on-surface-variant">
                Try another word, or clear the filters above.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {shown.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  mine={!theirs}
                  partnerName={partner?.displayName}
                />
              ))}
            </div>
          )}

          {!theirs && user.surpriseMode ? <Reservations tokens={list.reservations} /> : null}

          {theirs ? (
            <div className="flex flex-col items-center gap-1 px-4 pb-2 pt-4 text-center text-on-surface-variant">
              <div className="flex items-center gap-1.5 text-primary">
                <Icon name="heart" className="h-3.5 w-3.5" />
                <span className="text-label-md font-bold">
                  {partnerReveals
                    ? `${owner} can see which wishes you claimed`
                    : `${owner} has no notification of your clicks`}
                </span>
              </div>
              <p className="max-w-xs text-label-sm text-outline">
                {partnerReveals
                  ? `${owner} turned Surprise Mode off, so your reservations and purchases show on their list. Turn it back on in their settings to hide them.`
                  : "Keep the magic of anticipation alive. Everything on this tab stays confidential between you and Twofold."}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <BottomNav active={theirs ? "theirs" : "mine"} hasNew={hasNew} />
    </>
  );
}
