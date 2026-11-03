"use server";

import { requireUser } from "@/lib/auth";
import { fetchRendered } from "@/lib/headless";
import { fetchPage, type PageResult } from "@/lib/ssrf";
import { fetchZenRows } from "@/lib/zenrows";
import { draftFromPage, normalizeLink, titleFromUrl, type Draft } from "@/lib/parse";

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
  let draft = page.ok ? draftFromPage(page) : undefined;
  // Fast path: when traditional fetch already gave title + image, skip the slow paths.
  if (page.ok && draft?.title && draft.imageUrl) {
    return {
      ok: true,
      draft: { ...draft, title: draft.title ?? titleFromUrl(page.finalUrl), url: page.finalUrl },
      host: hostOf(page.finalUrl),
    };
  }
  if (!page.ok || draft?.title === undefined) {
    // A blocked shop still redirects, so pass the page we already landed on.
    const proxied = await fetchZenRows(link, page.ok ? page.finalUrl : undefined);
    const richer = draftFromPage(proxied);
    if (richer) {
      draft = richer;
      page = proxied;
    }
  }
  if (!page.ok || draft?.title === undefined) {
    const rendered = await fetchRendered(link);
    const richer = draftFromPage(rendered);
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

