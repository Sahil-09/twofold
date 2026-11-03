import Link from "next/link";
import { ItemCard } from "@/components/ItemCard";
import { Header } from "@/components/Header";
import { FulfilledIcon } from "@/components/icons";
import { getPartner, requireUser } from "@/lib/auth";
import { getFulfilled } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function FulfilledPage() {
  const user = await requireUser();
  const partner = await getPartner(user.id);
  const { own, given } = await getFulfilled(user.id, partner?.id ?? null);
  const partnerName = partner?.displayName ?? null;

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
          <p className="text-body-md text-on-surface-variant">Gifts delivered and wishes you closed.</p>

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
                      <ItemCard key={item.id} item={item} mine={false} partnerName={partnerName ?? undefined} settled />
                    ))}
                  </div>
                </section>
              ) : null}

              {own.length > 0 ? (
                <section>
                  <h2 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-2">Off your list</h2>
                  <div className="flex flex-col gap-3">
                    {own.map((item) => (
                      <ItemCard key={item.id} item={item} mine />
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
