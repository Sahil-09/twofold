"use server";

import { requireUser } from "@/lib/auth";
import { fetchRendered } from "@/lib/headless";
import { fetchPage, type PageResult } from "@/lib/ssrf";
import { fetchZenRows } from "@/lib/zenrows";
import { normalizeLink, parseProduct, titleFromUrl, type Draft } from "@/lib/parse";

export type ParseResult =
  | { ok: true; draft: Draft & { url: string }; warning?: string; host?: string }
  | { ok: false; error: string };

const hostOf = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};

const EDIT = "Fill the details in yourself.";
// Shops answer 200 with their generic home page when they block us, so a home-page
// title is a failed read, not a product.
const GATE = /site maintenance|bot check|captcha|access denied|page not found|^products$|^online shopping india/i;

function readDraft(page: PageResult): Draft | undefined {
  if (!page.ok) return undefined;
  const draft = parseProduct(page.html, page.finalUrl);
  return draft.title && !GATE.test(draft.title) ? draft : undefined;
}

export async function parseLink(raw: string): Promise<ParseResult> {
  const user = await requireUser();
  if (!user.autoParse) {
    return { ok: false, error: "Automatic Link Scraper is off. Add the wish by hand instead." };
  }

  const link = normalizeLink(String(raw ?? ""));
  if (!link) {
    return { ok: false, error: "That doesn't contain a link. Paste the full product URL." };
  }

  // A failed read is a normal state: hand back an editable draft rather than a dead end.
  // Order: plain fetch -> ZenRows proxy for blocked shops -> Chromium render.
  let page: PageResult = await fetchPage(link);
  let draft = page.ok ? parseProduct(page.html, page.finalUrl) : undefined;
  if (page.ok && draft && GATE.test(draft.title ?? "")) draft = undefined;
  // Fast path: when traditional fetch already gave title + image, skip the slow paths.
  if (page.ok && draft?.title && draft.imageUrl) {
    return {
      ok: true,
      draft: { ...draft, title: draft.title ?? titleFromUrl(page.finalUrl), url: page.finalUrl },
      host: hostOf(page.finalUrl),
    };
  }
  if (!page.ok || draft?.title === undefined) {
    const proxied = await fetchZenRows(link);
    const richer = readDraft(proxied);
    if (richer) {
      draft = richer;
      page = proxied;
    }
  }
  if (!page.ok || draft?.title === undefined) {
    const rendered = await fetchRendered(link);
    const richer = readDraft(rendered);
    if (richer) {
      draft = richer;
      page = rendered;
    }
  }

  if (!page.ok || !draft) {
    return {
      ok: true,
      draft: { url: link, title: titleFromUrl(link) },
      warning: `${page.ok ? "Couldn't read the details." : page.error} ${EDIT}`,
      host: hostOf(link),
    };
  }

  return {
    ok: true,
    draft: { ...draft, title: draft.title ?? titleFromUrl(page.finalUrl), url: page.finalUrl },
    warning: draft.title ? undefined : `Couldn't read the details. ${EDIT}`,
    host: hostOf(page.finalUrl),
  };
}

