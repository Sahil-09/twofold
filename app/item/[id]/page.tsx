import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveItemAction, deleteItemAction, updateItemAction } from "@/app/actions/items";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { Header } from "@/components/Header";
import { ItemFields } from "@/components/ItemFields";
import { Thumb } from "@/components/Thumb";
import { getPartner, requireUser } from "@/lib/auth";
import { getItem } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const partner = await getPartner(user.id);
  const { id } = await params;
  const { error } = await searchParams;
  const item = await getItem(user.id, id);
  if (!item) notFound();

  return (
    <>
      <Header user={user} section="Edit wish" />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16">
        <div className="flex flex-col gap-4 pt-2">
          <Link href="/" className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
            ← Back to my list
          </Link>

          <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-surface-low">
            <Thumb src={item.imageUrl} alt={item.title} className="h-48 w-full" />
          </div>

          <form action={updateItemAction.bind(null, item._id)} className="flex flex-col gap-4">
            <h1 className="text-title-md font-semibold">Edit wish</h1>

            {error ? (
              <p role="alert" className="text-label-md text-error">
                {error}
              </p>
            ) : null}

            <ItemFields
              defaults={{
                title: item.title,
                url: item.url,
                imageUrl: item.imageUrl,
                priceAmount: item.price?.amount,
                priceCurrency: item.price?.currency,
                priority: item.priority,
                quantity: item.quantity,
                occasionLabel: item.occasion?.label,
                occasionDate: item.occasion?.date,
                targetPrice: item.targetPrice,
                note: item.note,
                secret: item.secret,
              }}
              partnerName={partner?.displayName}
            />

            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-label-md text-tertiary underline decoration-outline-variant underline-offset-4"
              >
                Open the shop page
              </a>
            ) : null}

            <div className="mt-1 flex flex-wrap gap-3">
              <button type="submit" className="btn-primary flex-1">
                Save changes
              </button>
              <Link href="/" className="btn-ghost">
                Cancel
              </Link>
            </div>
          </form>

          <div className="card flex items-center justify-between gap-3 rounded-3xl p-5">
            <form action={archiveItemAction.bind(null, item._id)}>
              <button type="submit" className="btn-ghost h-10 px-4 text-label-md">
                Archive
              </button>
            </form>
            <form action={deleteItemAction.bind(null, item._id)}>
              <ConfirmSubmit
                message="Delete this wish for good?"
                className="text-label-md font-semibold text-error"
              >
                Delete
              </ConfirmSubmit>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
