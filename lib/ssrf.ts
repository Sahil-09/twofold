import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blocked.addSubnet(network, prefix, "ipv6");
}

export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !blocked.check(ip, "ipv4");
  if (family === 6) {
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
    if (mapped) return isPublicAddress(mapped[1]);
    return !blocked.check(ip, "ipv6");
  }
  return false;
}

export const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 5;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export type PageResult =
  | { ok: true; html: string; finalUrl: string }
  | { ok: false; error: string };

const fail = (error: string): PageResult => ({ ok: false, error });

/**
 * Fetches a user-supplied URL with the SSRF guard applied to every hop.
 * shortcut: hostname is resolved, then fetch re-resolves it, so a hostile DNS server could
 * rebind between the two. Only the two account holders can submit URLs, so this stays acceptable;
 * upgrade to a pinned-IP undici dispatcher if this ever opens to more people.
 */
export async function fetchPage(rawUrl: string, base?: string): Promise<PageResult> {
  let url: URL;
  try {
    url = base ? new URL(rawUrl, base) : new URL(rawUrl);
  } catch {
    return fail("That doesn't look like a link.");
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return fail("Only http and https links work.");
    }
    if (url.username || url.password) return fail("That link points somewhere private.");

    let addresses: string[];
    try {
      addresses = (await lookup(url.hostname, { all: true, verbatim: true })).map((a) => a.address);
    } catch {
      return fail("Couldn't find that site.");
    }
    if (addresses.length === 0 || !addresses.every(isPublicAddress)) {
      return fail("That link points somewhere private.");
    }

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "en",
        },
      });
    } catch {
      return fail("That site didn't answer.");
    }

    if (REDIRECTS.has(response.status)) {
      const location = response.headers.get("location");
      if (!location) return fail("The site sent a broken redirect.");
      try {
        url = new URL(location, url);
      } catch {
        return fail("The site sent a broken redirect.");
      }
      continue;
    }

    if (!response.ok) return fail(`That site returned ${response.status}.`);

    const html = await readCapped(response);
    return { ok: true, html, finalUrl: url.href };
  }

  return fail("Too many redirects.");
}

/** Reads up to MAX_BYTES and parses what it got: the head and gallery sit near the top. */
export async function readCapped(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size <= MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    chunks.push(value);
  }
  if (size > MAX_BYTES) await reader.cancel();
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks).subarray(0, MAX_BYTES));
}
