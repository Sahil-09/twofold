import type { Priority } from "./types";

/** Form order, copied from the Stitch Add Wish mock. */
export const PRIORITIES: { value: Priority; label: string; short: string; icon: "star" | "sparkle" | "bag" }[] = [
  { value: "everyday", label: "EveryDay", short: "EveryDay", icon: "bag" },
  { value: "toppick", label: "Top pick", short: "Top pick", icon: "sparkle" },
  { value: "nice", label: "Nice to have", short: "Nice to have", icon: "sparkle" },
  { value: "worth", label: "Worth it", short: "Worth it", icon: "sparkle" },
  { value: "dream", label: "Dream gift", short: "Dream gift", icon: "star" },
];

/** List order: the things they want most float to the top. */
export const PRIORITY_ORDER: Priority[] = ["everyday", "toppick", "nice", "worth", "dream"];

export function priorityLabel(value: Priority): string {
  return PRIORITIES.find((entry) => entry.value === value)?.short ?? "Nice to have";
}

export function priorityIcon(value: Priority): "star" | "sparkle" | "bag" {
  return PRIORITIES.find((entry) => entry.value === value)?.icon ?? "sparkle";
}

export function priorityRank(value: Priority): number {
  const index = PRIORITY_ORDER.indexOf(value);
  return index === -1 ? PRIORITY_ORDER.length : index;
}
