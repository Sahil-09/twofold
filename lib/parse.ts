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
    let candidate: string | undefined;
    // Walk backwards so opaque trailing codes (ASINs, ids, "/p/850bex") don't
    // win over the real product slug one or two segments earlier.
    for (let i = segments.length - 1; i >= 0; i -= 1) {
      const raw = segments[i].replace(/\.(html?|aspx?|php)$/i, "");
      if (!raw || raw.length < 3) continue;
      const words = raw
        .replace(/\d{4,}/g, " ")
        .replace(/[-_+]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!words) continue;
      // Skip opaque codes like an Amazon ASIN: no spaces and digits in it.
      if (!words.includes(" ") && /\d/.test(words) && words.length >= 6) continue;
      candidate = words;
      break;
    }
    if (!candidate) return undefined;
    return candidate.slice(0, 80).replace(/\b\w/g, (char) => char.toUpperCase());
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
  let unwrapped = title
    .trim()
    // Flipkart/Myntra lead-in: "Buy <product> …"
    .replace(/^buy\s+/i, "")
    // Marketing tails: everything from the first "online" onward ("…Online at Best
    // Prices in India - Flipkart.com", "…Online at Low Prices in India | …").
    .replace(/\bonline\b[\s\S]*$/i, "")
    // Amazon.in: Buy <product> Online at Low Prices in India | <brand> Reviews & Ratings
    .replace(/^amazon\.[a-z.]+\s*:\s*buy\s+/i, "")
    .trim();

  const host = hostname(pageUrl);
  const shops = [host, host?.split(".")[0], ...OTHER_SHOPS]
    .filter((name): name is string => Boolean(name))
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const suffix = new RegExp(
    `\\s+[|:–—-]\\s+(?:${shops.join("|")})(?:\\.[a-z]{2,3})?(?=\\s*[|:–—-]\\s|\\s*$).*$`,
    "i",
  );
  unwrapped = unwrapped.replace(suffix, "").trim();

  // Unknown shops: peel a TLD-shaped tail ("X : Webstore.co.in") once.
  unwrapped = unwrapped.replace(/\s+[|:–—-]\s+[^\s|:–—.]*\.?[^\s|:–—]*\.(?:com|in|net|org|co)[^\s|:–—]*$/i, "").trim();

  return unwrapped || title.trim();
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

function scanOffscreen(html: string): { amount: number; currency?: string } | undefined {
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

/** Amazon's price is an offscreen span, not JSON-LD or a meta tag. The main buy-box
 * price sits in these blocks; spans elsewhere are often a struck-through list price. */
function offscreenPrice(html: string): { amount: number; currency?: string } | undefined {
  const block =
    /<div\b[^>]*(?:id="corePriceDisplay[^"]*"|class="[^"]*priceToPay[^"]*")[^>]*>([\s\S]{0,4000}?)<\/div>/i.exec(
      html,
    )?.[1];
  return (block ? scanOffscreen(block) : undefined) ?? scanOffscreen(html);
}

/** Many shops skip OG and JSON-LD and just ship schema.org microdata. */
function itempropPrice(html: string): { amount: number; currency?: string } | undefined {
  const tags = html.match(/<[a-z0-9]+[^>]*\bitemprop=["']price["'][^>]*>/gi) ?? [];
  for (const tag of tags) {
    const attrs = attrMap(tag);
    let text: string | undefined = attrs.content;
    if (!text && !/^<(meta|link)\b/i.test(tag)) {
      const rest = html.slice(html.indexOf(tag) + tag.length);
      text = /^[^<]*?([\d.,]+)\s*(?:<\/[^>]+>|$)/i.exec(rest.slice(0, 80))?.[0] ?? undefined;
    }
    if (!text) continue;
    const decoded = decodeEntities(text).trim();
    if (!/\d/.test(decoded)) continue;
    const amount = toNumber(decoded);
    if (amount !== undefined) return { amount, currency: priceCurrency(decoded) };
  }
  return undefined;
}

/** Some full-SPA pages (Savana/Meesho-style) expose price only in the rendered body. */
function visiblePrice(html: string): { amount: number; currency?: string } | undefined {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const match = text.match(/₹\s?([\d,]+(?:\.\d+)?)/);
  if (!match) return undefined;
  const amount = toNumber(match[1]);
  if (amount === undefined) return undefined;
  return { amount, currency: "INR" };
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

function collectProducts(node: unknown, out: Record<string, unknown>[], depth = 0): void {
  if (depth > 6 || node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) collectProducts(child, out, depth + 1);
    return;
  }
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((t) => typeof t === "string" && t.toLowerCase() === "product")) out.push(obj);
  for (const value of Object.values(obj)) collectProducts(value, out, depth + 1);
}

type Pricing = { amount: number; currency?: string };

/** Sale price intent: an explicit offer.price wins; otherwise the floor of the spec/list. */
function offerPricing(value: unknown): Pricing | undefined {
  if (Array.isArray(value)) {
    // A list of offers/variants: sale-price intent is the cheapest currently offered.
    let best: Pricing | undefined;
    for (const entry of value) {
      const found = offerPricing(entry);
      if (found && (best === undefined || found.amount < best.amount)) best = found;
    }
    return best;
  }
  if (!value || typeof value !== "object") return undefined;
  const offer = value as Record<string, unknown>;
  const amount = toNumber(offer.price);
  if (amount !== undefined) {
    return { amount, currency: typeof offer.priceCurrency === "string" ? offer.priceCurrency : undefined };
  }
  const spec = offer.priceSpecification;
  if (spec) {
    const list = Array.isArray(spec) ? spec : [spec];
    const prices = list
      .map((entry) => toNumber((entry as Record<string, unknown> | null)?.price))
      .filter((p): p is number => p !== undefined);
    if (prices.length) {
      const specCurrency = (list[0] as Record<string, unknown> | undefined)?.priceCurrency;
      return {
        amount: Math.min(...prices),
        currency: typeof specCurrency === "string" ? specCurrency : undefined,
      };
    }
  }
  if (offer.offers) return offerPricing(offer.offers);
  const low = toNumber(offer.lowPrice);
  if (low !== undefined) {
    return { amount: low, currency: typeof offer.priceCurrency === "string" ? offer.priceCurrency : undefined };
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

/** Shops whose thumbnails come with a resolution you can rewrite away without another request. */
function upscaleImage(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // Amazon: .../I/xyz._SY355_.jpg -> .../I/xyz.jpg (m.media-amazon.com serves the original)
  if (/\/\/m\.media-amazon\.com\//i.test(url)) {
    return url.replace(/\._[\w,-]+_(?=\.)/g, "");
  }
  // Flipkart: rukminim…/image/128/128/… -> /image/832/832/
  if (/rukmin\w*\.(?:flixcart|flipkart)\.com\/image\//i.test(url)) {
    return url.replace(/\/image\/\d+\/\d+\//, "/image/832/832/");
  }
  return url;
}

/** Pure: HTML in, best-effort product draft out. Never throws. */
export function parseProduct(html: string, pageUrl: string): Draft {
  const products: Record<string, unknown>[] = [];
  collectProducts(jsonLd(html), products);
  // Prefer a Product that actually carries a price over the first one found.
  const product = products.find((p) => offerPricing(p.offers) !== undefined) ?? products[0];
  const meta = metaTags(html);

  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];

  let rawTitle =
    (typeof product?.name === "string" ? product.name : undefined) ??
    meta.get("og:title") ??
    meta.get("twitter:title") ??
    (titleTag ? decodeEntities(titleTag).trim() : undefined);

  // Client-rendered marketplaces (Savana/Meesho-style SPAs) ship an empty <title>
  // and no meta/JSON-LD, but a real <h1> once Chromium renders. Use it as a last resort.
  if (!rawTitle) {
    const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
    if (h1) rawTitle = decodeEntities(h1.replace(/<[^>]+>/g, " ").trim());
  }

  const title = rawTitle
    ? cleanTitle(decodeEntities(rawTitle).trim(), pageUrl).slice(0, 200)
    : undefined;

  let image =
    firstImage(product?.image) ??
    meta.get("og:image") ??
    meta.get("twitter:image") ??
    embeddedImage(html, pageUrl);

  if (!image) {
    // SPA fallback: the first non-icon, non-tracking image on the page.
    const imgRe = /<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgRe.exec(html))) {
      const candidate = imgMatch[1];
      if (!/\.(jpe?g|png|webp|avif)/i.test(candidate)) continue;
      if (/logo|favicon|icon|avatar|sprite|tracking|pixel|shield|badge/i.test(candidate)) continue;
      image = candidate;
      break;
    }
  }

  // Sale price intent: explicit offer price, then priceSpecification floor, then meta
  // (sale_price beats base price), then Amazon's buy-box, then microdata.
  const structured = product ? offerPricing(product.offers) : undefined;
  const metaPrice =
    toNumber(meta.get("product:sale_price:amount")) ??
    toNumber(meta.get("product:price:amount")) ??
    toNumber(meta.get("og:price:amount"));

  const buyBox = offscreenPrice(html);
  const scraped = structured === undefined && metaPrice === undefined
    ? (buyBox ?? itempropPrice(html) ?? visiblePrice(html))
    : undefined;

  const currency =
    structured?.currency ??
    meta.get("product:price:currency") ??
    meta.get("og:price:currency") ??
    scraped?.currency;

  return {
    title: title || undefined,
    imageUrl: upscaleImage(absolute(image, pageUrl)),
    priceAmount: structured?.amount ?? metaPrice ?? scraped?.amount,
    priceCurrency: currency?.slice(0, 3).toUpperCase(),
  };
}
