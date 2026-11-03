import { MAX_BYTES, validateUrl, type PageResult } from "./ssrf.ts";

const TIMEOUT_MS = 20_000;
const DOMAINS_TTL = 24 * 60 * 60 * 1000;

const fail = (error: string): PageResult => ({ ok: false, error });

/** ZenRows' answer when the month's credits are gone; callers stop asking. */
export const OUT_OF_CREDITS = "ZenRows is out of credits.";

export function zenRowsError(status: number): string {
  return status === 402 || status === 429 ? OUT_OF_CREDITS : `ZenRows returned ${status}.`;
}

/** Extract only works on domains ZenRows has prepared; the list is free and cacheable. */
const stripWww = (host: string) => host.replace(/^www\./, "");

let prepared: { hosts: Set<string>; expires: number } | undefined;

async function isPrepared(host: string, apiKey: string): Promise<boolean> {
  if (!prepared || prepared.expires < Date.now()) {
    try {
      const response = await fetch("https://api.zenrows.com/v1/extract/domains", {
        headers: { "X-API-Key": apiKey },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const body = (await response.json()) as { domains?: { domain?: string }[] };
      prepared = {
        hosts: new Set((body.domains ?? []).flatMap((entry) => (entry.domain ? [stripWww(entry.domain)] : []))),
        expires: Date.now() + DOMAINS_TTL,
      };
    } catch {
      return false;
    }
  }
  return prepared.hosts.has(stripWww(host));
}

/**
 * mode=auto lets ZenRows start with a plain request (1 credit) and step up to
 * premium proxies (25) only when the site blocks it. Forcing js_render and
 * premium_proxy would bill the expensive path on every page.
 */
export function buildZenRowsUrl(target: string, apiKey: string, extract: boolean): string {
  const url = new URL("https://api.zenrows.com/v1/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("url", target);
  url.searchParams.set("mode", "auto");
  if (extract) url.searchParams.set("extract", "auto");
  return url.toString();
}

/**
 * Fetches through ZenRows, for shops that serve a blocked page to our datacenter IP.
 * When the host is prepared, Extract rides along: one request returns both the raw
 * HTML and its named fields, so a second opinion costs no extra credits.
 */
export async function fetchZenRows(rawUrl: string, resolvedUrl?: string): Promise<PageResult> {
  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) return fail("ZenRows is not configured.");

  // The link leaves our server, so it gets the same guard as every other fetch.
  const checked = await validateUrl(rawUrl);
  if (!checked.ok) return fail(checked.error);
  // A short link (dl.flipkart.com) hosts its own domain, which Extract may not have
  // prepared; the page we already resolved is the one worth sending.
  const resolved = resolvedUrl ? await validateUrl(resolvedUrl) : undefined;
  const target = resolved?.ok ? resolved.url.href : checked.url.href;

  const extract = await isPrepared(new URL(target).hostname, apiKey);
  const first = await request(buildZenRowsUrl(target, apiKey, extract), target, extract);
  if (!first.ok && extract) {
    // REQS007: the domain list was stale, so forget it and take the plain path.
    prepared = undefined;
    return request(buildZenRowsUrl(target, apiKey, false), target, false);
  }
  return first;
}

async function request(url: string, target: string, extract: boolean): Promise<PageResult> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return fail("That site didn't answer.");
  }

  if (!response.ok) return fail(zenRowsError(response.status));

  let body: string;
  try {
    body = await response.text();
  } catch {
    return fail("That site didn't answer.");
  }

  if (extract) {
    try {
      // Extract answers with { html, parsed } instead of the page itself.
      const json = JSON.parse(body) as { html?: unknown; parsed?: unknown };
      if (typeof json.html === "string") {
        return { ok: true, html: json.html.slice(0, MAX_BYTES), finalUrl: target, parsed: json.parsed };
      }
    } catch {
      // Not JSON: fall through and treat it as HTML.
    }
  }

  return { ok: true, html: body.slice(0, MAX_BYTES), finalUrl: target };
}
