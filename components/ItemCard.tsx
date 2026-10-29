import Link from "next/link";
import { boughtAction, claimAction, givenAction, unclaimAction } from "@/app/actions/claims";
import { hostOf, money, shortDate } from "@/lib/format";
import type { ItemView } from "@/lib/items";
import { priorityIcon, priorityLabel } from "@/lib/priority";
import type { Priority } from "@/lib/types";
import { Icon } from "./icons";
import { Thumb } from "./Thumb";

/** Chip colours per priority; the Stitch partner card uses the filled variants. */
const TONE: Record<Priority, { filled: string; text: string }> = {
  dream: { filled: "bg-secondary-fixed text-on-secondary-fixed", text: "text-secondary" },
  worth: { filled: "bg-primary-fixed text-on-primary-fixed", text: "text-primary" },
toppick: { filled: "bg-tertiary-fixed text-on-tertiary-fixed", text: "text-tertiary" },
  nice: { filled: "bg-surface-container text-on-surface-variant", text: "text-on-surface-variant" },
  everyday: {
    filled: "bg-tertiary-fixed text-on-tertiary-fixed",
    text: "text-tertiary",
  },
};

export function ItemCard({
  item,
  mine,
  partnerName,
}: {
  item: ItemView;
  mine: boolean;
  partnerName?: string;
}) {
  const host = hostOf(item.url);
  const tone = TONE[item.priority] ?? TONE.nice;
  const hitTarget =
    item.price !== undefined &&
    item.targetPrice !== undefined &&
    item.price.amount <= item.targetPrice;
  const added = shortDate(item.createdAt);

  const store = host ? (
    <span className="text-label-sm font-medium text-outline">{host}</span>
  ) : null;

  const storeLink = host ? (
    item.url ? (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-label-sm font-medium tracking-wide text-outline"
      >
        {host}
      </a>
    ) : (
      store
    )
  ) : null;

  if (!mine) {
    return (
      <article className="card flex flex-col gap-4 rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <span className={`chip ${tone.filled}`}>
            <Icon name={priorityIcon(item.priority)} className="h-3.5 w-3.5" />
            {priorityLabel(item.priority)}
            {item.occasion?.label ? ` · ${item.occasion.label}` : ""}
          </span>
          {storeLink}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl shadow-sm">
            <Thumb src={item.imageUrl} alt={item.title} className="h-24 w-24" />
            {item.claim?.bought ? (
              <span className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-surface-lowest/90 text-primary backdrop-blur-sm">
                <Icon name="check" className="h-3 w-3" />
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 text-title-md font-bold leading-snug">{item.title}</h2>
            <div className="mt-1 flex items-baseline gap-2">
              {item.price ? (
                <span
                  className={`text-headline-sm font-bold ${
                    item.claim ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {money(item.price.amount, item.price.currency)}
                </span>
              ) : null}
              {item.quantity > 1 ? (
                <span className="text-label-sm text-outline">×{item.quantity}</span>
              ) : null}
              {hitTarget ? (
                <span className="text-label-sm text-outline">at your target</span>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-on-surface-variant">
              <Icon name="hourglass" className="h-3.5 w-3.5" />
              <span className="text-label-sm">
                Added {added}
                {item.occasion?.label ? ` for ${item.occasion.label}` : ""}
              </span>
            </div>
          </div>
        </div>

        {item.note ? (
          <div className="rounded-2xl bg-surface-low p-3">
            <p className="text-label-sm italic text-on-surface-variant">
              “{item.note}” — {partnerName ?? "them"}
            </p>
          </div>
        ) : null}

        {item.claim?.bought ? (
          <>
            <div className="flex items-start gap-2.5 rounded-2xl bg-primary-fixed/40 p-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                <Icon name="check" className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label-md font-bold leading-tight text-on-primary-fixed">
                  Purchased by you on {shortDate(item.claim.boughtAt ?? item.claim.claimedAt)}
                </p>
                <p className="mt-0.5 text-label-sm text-on-primary-fixed-variant">
                  Hidden from {partnerName ?? "them"}. Packaged &amp; ready to surprise! 🎉
                </p>
              </div>
              <Icon name="receipt" className="h-4 w-4 shrink-0 text-primary" />
            </div>

            <div className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-label-lg font-bold text-on-primary">
              <Icon name="checkCircle" className="h-4 w-4" />
              Marked as Purchased 🎉
            </div>

            <form action={givenAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <button type="submit" className="btn-soft h-11 w-full text-label-md">
                Given — archive it
              </button>
            </form>
          </>
        ) : item.claim ? (
          <>
            <div className="rounded-2xl bg-surface-low p-3">
              <p className="text-label-md font-semibold text-on-surface">Reserved by you</p>
              <p className="text-label-sm text-on-surface-variant">
                Hidden from {partnerName ?? "them"}. Release it if plans change.
              </p>
            </div>

            <form action={boughtAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <button type="submit" className="btn-primary w-full">
                <Icon name="checkCircle" className="h-4 w-4" />
                Mark as purchased 🎉
              </button>
            </form>

            <form action={unclaimAction} className="text-center">
              <input type="hidden" name="itemId" value={item.id} />
              <button
                type="submit"
                className="text-label-sm text-on-surface-variant underline decoration-outline-variant underline-offset-4"
              >
                Release
              </button>
            </form>
          </>
        ) : (
          <form action={claimAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <button type="submit" className="btn-primary w-full">
              <Icon name="gift" className="h-4 w-4" />
              I Plan to Buy
            </button>
          </form>
        )}
      </article>
    );
  }

  return (
    <article className="card flex flex-col gap-3 rounded-3xl p-5">
      <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-surface-low">
        <Link href={`/item/${item.id}`} className="block h-full w-full">
          <Thumb src={item.imageUrl} alt={item.title} className="h-48 w-full" />
        </Link>

        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-surface-lowest/90 px-2.5 py-1 shadow-sm backdrop-blur-md">
          <Icon
            name={priorityIcon(item.priority)}
            className={`h-3.5 w-3.5 ${tone.text}`}
          />
          <span className={`text-label-sm font-semibold ${tone.text}`}>
            {priorityLabel(item.priority)}
            {item.occasion?.label ? ` · ${item.occasion.label}` : ""}
          </span>
        </span>

        {host ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute right-3 top-3 rounded-full bg-surface-lowest/90 px-2.5 py-1 shadow-sm backdrop-blur-md"
          >
            <span className="text-label-sm font-medium text-on-surface-variant">{host}</span>
          </a>
        ) : null}
      </div>

      <Link href={`/item/${item.id}`} className="flex items-start justify-between gap-2 pt-1">
        <span className="min-w-0">
          <span className="block truncate text-title-md font-semibold">{item.title}</span>
          {item.note ? (
            <span className="mt-0.5 block truncate text-label-sm text-outline">{item.note}</span>
          ) : null}
        </span>
        {item.price ? (
          <span className="shrink-0 text-title-md font-bold text-primary">
            {money(item.price.amount, item.price.currency)}
          </span>
        ) : null}
      </Link>

      {item.claim ? (
        <div className="flex items-center gap-2 rounded-2xl bg-primary-fixed/40 px-3 py-2">
          <Icon
            name={item.claim.bought ? "checkCircle" : "gift"}
            className="h-4 w-4 shrink-0 text-primary"
          />
          <span className="text-label-sm font-semibold text-on-primary-fixed">
            {partnerName ?? "Your partner"} {item.claim.bought ? "bought" : "reserved"} this ·{" "}
            {shortDate(item.claim.boughtAt ?? item.claim.claimedAt)}
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="chip bg-surface-low text-on-surface-variant">
            {hitTarget ? (
              <>
                <Icon name="checkCircle" className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary">Target hit</span>
              </>
            ) : item.occasion?.label ? (
              <>
                <Icon name="cake" className="h-3.5 w-3.5" />
                Special Occasion
              </>
            ) : (
              <>
                <Icon name="hourglass" className="h-3.5 w-3.5" />
                Still wishing for
              </>
            )}
          </span>
          {item.quantity > 1 ? (
            <span className="chip bg-surface-low text-on-surface-variant">×{item.quantity}</span>
          ) : null}
          {item.secret ? (
            <span className="chip bg-primary-fixed text-on-primary-fixed" title="Only you can see this">
              <Icon name="lock" className="h-3 w-3" />
              Secret
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/item/${item.id}`}
            aria-label="Edit wish"
            className="grid h-8 w-8 place-items-center rounded-full bg-surface-low text-outline transition-colors hover:text-primary"
          >
            <Icon name="pencil" className="h-4 w-4" />
          </Link>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`Open on ${host}`}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-low text-outline transition-colors hover:text-primary"
            >
              <Icon name="external" className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
