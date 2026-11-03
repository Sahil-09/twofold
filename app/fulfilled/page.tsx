import Link from "next/link";
import { Header } from "@/components/Header";
import { FulfilledIcon } from "@/components/icons";
import { Thumb } from "@/components/Thumb";
import { getPartner, requireUser } from "@/lib/auth";
import { getFulfilled } from "@/lib/items";
import { hostOf, money, shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FulfilledPage() {
  const user = await requireUser();
  const partner = await getPartner(user.id);
  const { own, given } = await getFulfilled(user.id, partner?.id ?? null);

  return (
    <>
      <Header user={user} section="Fulfilled" unread={0} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16">
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
              ← Back to list
            </Link>
            <span className="chip bg-surface-low text-on-surface-variant">
              {own.length + given.length} {own.length + given.length === 1 ? "item" : "items"}
            </span>
          </div>

          <h1 className="text-headline-lg-mobile font-semibold tracking-[-0.015em]">Fulfilled wishes</h1>
          <p className="text-body-md text-on-surface-variant">Gifts given and wishes you closed.</p>

          {own.length === 0 && given.length === 0 ? (
            <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
              <FulfilledIcon className="h-8 w-8 text-outline-variant" />
              <p className="text-title-md font-semibold">Nothing fulfilled yet</p>
              <p className="max-w-xs text-body-md text-on-surface-variant">When you give a gift or archive a wish, it shows here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {given.length > 0 ? (
                <section>
                  <h2 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-2">Given by you</h2>
                  <div className="flex flex-col gap-3">
                    {given.map((item) => (
                      <article key={item.id} className="card flex gap-4 rounded-3xl p-4">
                        <a href={item.url ?? "#"} target="_blank" rel="noreferrer noopener" className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-sm block">
                          <Thumb src={item.imageUrl} alt={item.title} className="h-20 w-20" />
                        </a>
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-title-md font-bold">{item.title}</h3>
                          <div className="mt-1 flex items-baseline gap-2">
                            {item.price ? <span className="text-label-md font-bold text-primary">{money(item.price.amount, item.price.currency)}</span> : null}
                            {item.url ? <span className="text-label-sm text-outline">{hostOf(item.url)}</span> : null}
                          </div>
                          <p className="mt-1 text-label-sm text-outline">Given · {shortDate(item.claim?.boughtAt ?? item.claim?.claimedAt)}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {own.length > 0 ? (
                <section>
                  <h2 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-2">Off your list</h2>
                  <div className="flex flex-col gap-3">
                    {own.map((item) => (
                      <Link key={item.id} href={`/item/${item.id}`} className="card flex gap-4 rounded-3xl p-4 transition-colors hover:bg-surface-low">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-sm">
                          <Thumb src={item.imageUrl} alt={item.title} className="h-20 w-20" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-title-md font-bold">{item.title}</h3>
                          <div className="mt-1 flex items-baseline gap-2">
                            {item.price ? <span className="text-label-md font-bold text-primary">{money(item.price.amount, item.price.currency)}</span> : null}
                            {item.url ? <span className="text-label-sm text-outline">{hostOf(item.url)}</span> : null}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
