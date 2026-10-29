"use server";

import { requireUser } from "@/lib/auth";
import { fetchRendered } from "@/lib/headless";
import { fetchPage, type PageResult } from "@/lib/ssrf";
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
  // Order: plain fetch -> Chromium render when the fetch was blocked or read nothing.
  let page: PageResult = await fetchPage(link);
  let draft = page.ok ? parseProduct(page.html, page.finalUrl) : undefined;
  if (page.ok && draft && /site maintenance/i.test(draft.title ?? "")) {
    draft = undefined;
  }
  if (!page.ok || draft?.title === undefined) {
    const rendered = await fetchRendered(link);
    if (rendered.ok) {
      const richer = parseProduct(rendered.html, rendered.finalUrl);
      if (richer.title) {
        draft = richer;
        page = rendered;
      }
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
