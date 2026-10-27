export type Draft = {
  title?: string;
  imageUrl?: string;
  priceAmount?: number;
  priceCurrency?: string;
};

/** Pulls the first URL out of pasted text, and accepts a bare domain. */
export function normalizeLink(raw: string): string | undefined {
  const text = raw.trim();
  if (!text) return undefined;

  const inline = /https?:\/\/[^\s"'<>]+/i.exec(text);
  if (inline) return inline[0].replace(/[.,;:)\]]+$/, "");

  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text)) {
    return `https://${text}`.replace(/[.,;:)\]]+$/, "");
  }
  return undefined;
}

/** Last-resort title so a failed parse still gives you something editable. */
export function titleFromUrl(link: string): string | undefined {
  try {
    const segments = new URL(link).pathname.split("/").filter(Boolean);
    const last = segments.at(-1)?.replace(/\.(html?|aspx?|php)$/i, "");
    if (!last || last.length < 3) return undefined;
    const words = last
      .replace(/\d{4,}/g, " ")
      .replace(/[-_+]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!words) return undefined;
    // Skip opaque codes like an Amazon ASIN: no spaces, digits in it.
    if (!words.includes(" ") && /\d/.test(words) && words.length >= 6) return undefined;
    return words.slice(0, 80).replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return undefined;
  }
}

const decodeEntities = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

function attrMap(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tag))) {
    attrs[match[1].toLowerCase()] = match[3] ?? match[4] ?? match[5] ?? "";
  }
  return attrs;
}

function metaTags(html: string): Map<string, string> {
  const tags = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = attrMap(tag);
    const key = (attrs.property ?? attrs.name)?.toLowerCase();
    if (key && attrs.content) tags.set(key, decodeEntities(attrs.content));
  }
  return tags;
}

function hostname(pageUrl: string): string | undefined {
  try {
    return new URL(pageUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return undefined;
  }
}

// Shops that append their name to <title> without it matching the hostname.
const OTHER_SHOPS = ["amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "etsy", "ebay"];

/** Drops the shop wrapper around <title>: "Amazon.in: Buy X Online at Low Prices…", "X | Shop". */
function cleanTitle(title: string, pageUrl: string): string {
  // Amazon.in: Buy <product> Online at Low Prices in India | <brand> Reviews & Ratings
  const unwrapped = title
    .trim()
    .replace(/^amazon\.[a-z.]+\s*:\s*buy\s+/i, "")
    .replace(/\s+online at low prices in india[\s\S]*$/i, "")
    .trim();

  const host = hostname(pageUrl);
  const shops = [host, host?.split(".")[0], ...OTHER_SHOPS]
    .filter((name): name is string => Boolean(name))
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const suffix = new RegExp(
    `\\s+[|:–—-]\\s+(?:${shops.join("|")})(?:\\.[a-z]{2,3})?(?=\\s*[|:–—-]\\s|\\s*$).*$`,
    "i",
  );
  const out = unwrapped.replace(suffix, "").trim();
  return out || title.trim();
}

const priceCurrency = (text: string): string | undefined => {
  if (/₹|\brs\.?\b|\binr\b/i.test(text)) return "INR";
  if (/\$|\busd\b/i.test(text)) return "USD";
  if (/€|\beur\b/i.test(text)) return "EUR";
  if (/£|\bgbp\b/i.test(text)) return "GBP";
  return undefined;
};

/** Amazon ships no og:image; the gallery lives in these two attributes instead. */
function embeddedImage(html: string, pageUrl: string): string | undefined {
  const dynamic = /data-a-dynamic-image="([^"]+)"/.exec(html)?.[1];
  if (dynamic) {
    try {
      const urls = JSON.parse(decodeEntities(dynamic)) as Record<string, unknown>;
      const first = Object.keys(urls)[0];
      if (first) return absolute(first, pageUrl);
    } catch {
      // Not JSON: fall through to the landing image.
    }
  }
  const landing = /<img\b[^>]*\bid="landingImage"[^>]*>/i.exec(html)?.[0];
  return landing ? absolute(attrMap(landing).src, pageUrl) : undefined;
}

/** Amazon's price is an offscreen span, not JSON-LD or a meta tag. */
function offscreenPrice(html: string): { amount: number; currency?: string } | undefined {
  const re = /<span\b[^>]*\bclass="[^"]*\ba-offscreen\b[^"]*"[^>]*>([^<]*)<\/span>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const text = decodeEntities(match[1]).trim();
    if (!/\d/.test(text) || !priceCurrency(text)) continue;
    const amount = toNumber(text);
    if (amount !== undefined) return { amount, currency: priceCurrency(text) };
  }
  return undefined;
}

function jsonLd(html: string): unknown[] {
  const nodes: unknown[] = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      nodes.push(JSON.parse(match[1].trim()));
    } catch {
      // Broken JSON-LD is common; the OG tags are the fallback.
    }
  }
  return nodes;
}

function findProduct(node: unknown, depth = 0): Record<string, unknown> | undefined {
  if (depth > 6 || node === null || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findProduct(child, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((t) => typeof t === "string" && t.toLowerCase() === "product")) return obj;
  for (const value of Object.values(obj)) {
    const found = findProduct(value, depth + 1);
    if (found) return found;
  }
  return undefined;
}

export function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[^\d.,]/g, "");
  if (!cleaned) return undefined;
  const amount =
    cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstImage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(firstImage).find(Boolean);
  if (value && typeof value === "object") return firstImage((value as { url?: unknown }).url);
  return undefined;
}

function absolute(value: string | undefined, pageUrl: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim(), pageUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Pure: HTML in, best-effort product draft out. Never throws. */
export function parseProduct(html: string, pageUrl: string): Draft {
  const product = findProduct(jsonLd(html));
  const meta = metaTags(html);

  const offersValue = product?.offers;
  const offers = Array.isArray(offersValue) ? offersValue[0] : offersValue;
  const offer = offers && typeof offers === "object" ? (offers as Record<string, unknown>) : undefined;

  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];

  const rawTitle =
    (typeof product?.name === "string" ? product.name : undefined) ??
    meta.get("og:title") ??
    meta.get("twitter:title") ??
    titleTag;

  const title = rawTitle
    ? cleanTitle(decodeEntities(rawTitle).trim(), pageUrl).slice(0, 200)
    : undefined;

  const image =
    firstImage(product?.image) ??
    meta.get("og:image") ??
    meta.get("twitter:image") ??
    embeddedImage(html, pageUrl);

  const structuredPrice =
    toNumber(offer?.price) ??
    toNumber(offer?.lowPrice) ??
    toNumber(meta.get("product:price:amount")) ??
    toNumber(meta.get("og:price:amount")) ??
    toNumber(meta.get("product:sale_price:amount"));

  const scraped = structuredPrice === undefined ? offscreenPrice(html) : undefined;

  const currency =
    (typeof offer?.priceCurrency === "string" ? offer.priceCurrency : undefined) ??
    meta.get("product:price:currency") ??
    meta.get("og:price:currency") ??
    scraped?.currency;

  return {
    title: title || undefined,
    imageUrl: absolute(image, pageUrl),
    priceAmount: structuredPrice ?? scraped?.amount,
    priceCurrency: currency?.slice(0, 3).toUpperCase(),
  };
}
