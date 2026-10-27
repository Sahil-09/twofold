// Indian rupees by default; en-IN keeps lakh grouping.
const DEFAULT_CURRENCY = "INR";

export function money(amount: number, currency?: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || DEFAULT_CURRENCY,
      // Whole rupees read better than ₹20,999.00; keep cents when they exist.
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency ?? DEFAULT_CURRENCY} ${new Intl.NumberFormat("en-IN").format(amount)}`;
  }
}

export { DEFAULT_CURRENCY };

/** The shop name shown on a card, without the noise. */
export function hostOf(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** "Sep 28" for a createdAt ISO string or a stored YYYY-MM-DD date. */
export function shortDate(value?: string): string | undefined {
  if (!value) return undefined;
  // A bare date is UTC midnight; adding noon keeps it on the intended day locally.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/** "just now", "12m ago", "3h ago", "2d ago", then a date. */
export function relativeTime(value: Date | string): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return shortDate(new Date(then).toISOString()) ?? "";
}
