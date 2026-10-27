"use server";

import { requireUser } from "@/lib/auth";
import { fetchPage } from "@/lib/ssrf";
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
  const page = await fetchPage(link);
  if (!page.ok) {
    return {
      ok: true,
      draft: { url: link, title: titleFromUrl(link) },
      warning: `${page.error} Fill the details in yourself.`,
      host: hostOf(link),
    };
  }

  const draft = parseProduct(page.html, page.finalUrl);
  return {
    ok: true,
    draft: { ...draft, title: draft.title ?? titleFromUrl(page.finalUrl), url: page.finalUrl },
    warning: draft.title ? undefined : "Couldn't read the details. Fill them in yourself.",
    host: hostOf(page.finalUrl),
  };
}
