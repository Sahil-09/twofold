import { hostOf } from "./format.ts";
import { priorityRank } from "./priority.ts";
import type { Priority } from "./types";
import type { ItemView } from "./view";

export type ListSort = "wanted" | "newest" | "priceAsc" | "priceDesc";
export type ListState = "all" | "planned" | "unplanned";

export type ListFilter = {
  /** Free text over the title, the note and the shop. */
  q?: string;
  priority?: Priority | "all";
  /** Only the partner's tab can use this: the owner never receives claim data by default. */
  state?: ListState;
  sort?: ListSort;
};

/** The one currency every priced item shares, or `undefined` when they differ (or nothing is priced). */
export function singleCurrency(items: ItemView[]): string | undefined {
  const codes = new Set(items.flatMap((item) => (item.price ? [item.price.currency] : [])));
  return codes.size === 1 ? [...codes][0] : undefined;
}

/**
 * Search, filter and sort an already-serialized list. Pure and in memory: a couple's list is small,
 * and doing it here means the counts and the vault keep seeing every item.
 */
export function applyList(items: ItemView[], filter: ListFilter = {}): ItemView[] {
  const q = filter.q?.trim().toLowerCase() ?? "";
  const priority = filter.priority ?? "all";
  const state = filter.state ?? "all";
  const sort = filter.sort ?? "wanted";

  const kept = items.filter((item) => {
    if (priority !== "all" && item.priority !== priority) return false;
    if (state === "planned" && !item.claim) return false;
    if (state === "unplanned" && item.claim) return false;
    if (!q) return true;
    return [item.title, item.note, hostOf(item.url)].some((value) =>
      value?.toLowerCase().includes(q),
    );
  });

  return [...kept].sort((a, b) => {
    if (sort === "newest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    if (sort === "priceAsc" || sort === "priceDesc") {
      // A wish with no price always sinks, whichever direction is chosen.
      if (!a.price) return b.price ? 1 : 0;
      if (!b.price) return -1;
      const diff = a.price.amount - b.price.amount;
      return (sort === "priceAsc" ? diff : -diff) || Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
    return (
      priorityRank(a.priority) - priorityRank(b.priority) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  });
}
