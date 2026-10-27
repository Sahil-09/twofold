import type { ItemDoc, Priority } from "./types";

/** The only shape an item is ever sent to the browser in. */
export type ItemView = {
  id: string;
  title: string;
  url?: string;
  imageUrl?: string;
  price?: { amount: number; currency: string };
  note?: string;
  priority: Priority;
  quantity: number;
  occasion?: { label: string; date?: string };
  targetPrice?: number;
  /** Owner view only: the partner never learns an item is secret. */
  secret?: boolean;
  createdAt: string;
  /**
   * The partner's own claim. The owner gets one too, but only when they turned Surprise Mode off.
   * By default it never reaches the owner.
   */
  claim?: { claimedAt: string; boughtAt?: string; bought: boolean };
};

export type ListView = {
  items: ItemView[];
  /** Opaque, order-shuffled tokens. One per claim; carries no id, title, price or image. Owner view only. */
  reservations: string[];
};

export const toView = (
  item: ItemDoc,
  claim?: { claimedAt: Date; boughtAt?: Date },
): ItemView => {
  const view: ItemView = {
    id: item._id,
    title: item.title,
    url: item.url,
    imageUrl: item.imageUrl,
    price: item.price ? { amount: item.price.amount, currency: item.price.currency } : undefined,
    note: item.note,
    priority: item.priority,
    quantity: item.quantity,
    occasion: item.occasion,
    targetPrice: item.targetPrice,
    createdAt: item.createdAt.toISOString(),
  };

  // The key is added only when a caller passes a claim: the partner's own, or the owner's list
  // when Surprise Mode is off. Default ownerView still passes none.
  if (claim) {
    view.claim = {
      claimedAt: claim.claimedAt.toISOString(),
      boughtAt: claim.boughtAt?.toISOString(),
      bought: Boolean(claim.boughtAt),
    };
  }

  return view;
};

/**
 * The owner's copy of their own item. No claim unless the owner opted out of Surprise Mode;
 * callers must pass it explicitly, so the default stays private.
 */
export function ownerView(
  item: ItemDoc,
  claim?: { claimedAt: Date; boughtAt?: Date },
): ItemView {
  return { ...toView(item, claim), secret: item.secret || undefined };
}
