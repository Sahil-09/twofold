import { MAX_BYTES, validateUrl, type PageResult } from "./ssrf.ts";

const TIMEOUT_MS = 20_000;

const fail = (error: string): PageResult => ({ ok: false, error });

/**
 * mode=auto lets ZenRows start with a plain request (1 credit) and step up to
 * premium proxies (25) only when the site blocks it. Forcing js_render and
 * premium_proxy would bill the expensive path on every page.
 */
export function buildZenRowsUrl(target: string, apiKey: string): string {
  const url = new URL("https://api.zenrows.com/v1/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("url", target);
  url.searchParams.set("mode", "auto");
  return url.toString();
}

/** Fetches through ZenRows, for shops that serve a blocked page to our datacenter IP. */
export async function fetchZenRows(rawUrl: string): Promise<PageResult> {
  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) return fail("ZenRows is not configured.");

  // The link leaves our server, so it gets the same guard as every other fetch.
  const checked = await validateUrl(rawUrl);
  if (!checked.ok) return fail(checked.error);
  const target = checked.url.href;

  let response: Response;
  try {
    response = await fetch(buildZenRowsUrl(target, apiKey), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return fail("That site didn't answer.");
  }

  if (!response.ok) return fail(`ZenRows returned ${response.status}.`);

  try {
    return { ok: true, html: (await response.text()).slice(0, MAX_BYTES), finalUrl: target };
  } catch {
    return fail("That site didn't answer.");
  }
}
