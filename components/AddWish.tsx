"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItemAction } from "@/app/actions/items";
import { parseLink } from "@/app/actions/parse";
import { Icon } from "./icons";
import { ItemFields } from "./ItemFields";
import { Thumb } from "./Thumb";

type Draft = {
  url: string;
  title?: string;
  imageUrl?: string;
  priceAmount?: number;
  priceCurrency?: string;
};

type Loaded = { draft: Draft; warning?: string; host?: string };

export function AddWish({
  partnerName = "your partner",
  wishCount,
  reservedCount,
  autoParse = true,
}: {
  partnerName?: string;
  wishCount: number;
  reservedCount: number;
  /** Off hides the paste bar; the server refuses parsing too. */
  autoParse?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, startParse] = useTransition();
  const [saving, startSave] = useTransition();
  const router = useRouter();

  function read(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setError(null);
    startParse(async () => {
      const result = await parseLink(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLoaded({ draft: result.draft, warning: result.warning, host: result.host });
    });
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!pasted.trim()) return;
    event.preventDefault();
    setUrl(pasted);
    read(pasted);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    read(url);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(event.currentTarget).entries());
    startSave(async () => {
      const result = await createItemAction(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLoaded(null);
      setUrl("");
      setError(null);
      router.refresh();
    });
  }

  function reset() {
    setLoaded(null);
    setUrl("");
    setError(null);
  }

  return (
    <>
      <div>
        {autoParse ? (
          <>
            <form
              onSubmit={handleSubmit}
              className="flex items-center justify-between gap-3 rounded-3xl bg-surface-lowest p-2.5 shadow-rest"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 pl-2">
                <Icon name="link" className="h-4 w-4 shrink-0 text-outline" />
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  onPaste={handlePaste}
                  className="w-full min-w-0 truncate bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none"
                  placeholder="Paste any link to auto-preview…"
                  inputMode="url"
                  autoComplete="off"
                  aria-label="Product link"
                />
              </div>
              <button
                type="submit"
                className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-4 py-2 text-label-md font-semibold text-on-primary shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                disabled={parsing || !url.trim()}
              >
                <Icon name="plus" className="h-4 w-4" />
                {parsing ? "Reading…" : "Add Link"}
              </button>
            </form>

            {error && !loaded ? (
              <p role="alert" className="mt-3 px-1 text-label-md text-error">
                {error}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
              <button
                type="button"
                onClick={() => setLoaded({ draft: { url: "" } })}
                className="text-label-md text-on-surface-variant underline decoration-outline-variant underline-offset-4"
              >
                Or add something without a link
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setLoaded({ draft: { url: "" } })}
            className="btn-primary h-12 w-full"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add a wish by hand
          </button>
        )}
      </div>

      {loaded ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="New wish"
          className="fixed inset-0 z-[60] overflow-y-auto bg-surface"
        >
          <div className="mx-auto flex w-full max-w-xl flex-col px-4 pb-28 pt-safe">
            <div className="flex flex-col items-center pt-3">
              <div className="mb-3 h-1.5 w-12 rounded-full bg-surface-high" />
              <div className="flex w-full items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-headline-lg-mobile font-semibold tracking-[-0.015em]">
                      New Wish
                    </h1>
                    {loaded.host ? (
                      <span className="chip bg-secondary-fixed text-on-secondary-fixed">
                        <Icon name="link" className="h-3 w-3" />
                        {loaded.host}
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-0.5 flex items-center gap-1.5 text-label-md text-on-surface-variant">
                    <span className="h-2 w-2 rounded-full bg-primary-container" />
                    Syncs instantly with {partnerName}&apos;s feed
                  </span>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="shrink-0 rounded-full bg-surface-container px-4 py-2 text-label-md text-on-surface-variant active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="card mt-4 flex flex-col gap-3 p-4">
              <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-surface-low">
                <Thumb src={loaded.draft.imageUrl} alt="" className="h-56 w-full" />
                <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-label-sm font-medium text-on-surface shadow-sm backdrop-blur-md">
                  <Icon name="sparkle" className="h-3.5 w-3.5" />
                  Auto-extracted details
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Item status
                  </span>
                  <span className="chip bg-surface-container text-on-surface">
                    {loaded.draft.priceAmount === undefined ? "No price yet" : "Price found"}
                  </span>
                </div>
                {loaded.draft.url ? (
                  <a
                    href={loaded.draft.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-1 text-label-sm text-primary"
                  >
                    View source URL
                    <Icon name="external" className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
              {loaded.warning ? (
                <p className="rounded-2xl bg-surface-low px-4 py-3 text-label-md text-tertiary">
                  {loaded.warning}
                </p>
              ) : null}

              <ItemFields
                defaults={{
                  title: loaded.draft.title,
                  url: loaded.draft.url,
                  imageUrl: loaded.draft.imageUrl,
                  priceAmount: loaded.draft.priceAmount,
                  priceCurrency: loaded.draft.priceCurrency,
                }}
                partnerName={partnerName}
              />

              {error ? (
                <p role="alert" className="text-label-md text-error">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn-primary mt-1 h-14 w-full" disabled={saving}>
                <Icon name="heart" className="h-4 w-4" />
                {saving ? "Saving…" : "Add to my list"}
              </button>

              <p className="flex items-center justify-center gap-2 text-center text-label-sm text-on-surface-variant">
                <Icon name="repeat" className="h-3.5 w-3.5" />
                {partnerName} will receive a gentle pulse in your paired timeline
              </p>
            </form>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl bg-surface-low p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary-fixed text-label-sm font-bold text-on-secondary-fixed">
                  {wishCount}
                </span>
                <div className="flex flex-col">
                  <span className="text-label-md font-semibold">Shared Wishlist</span>
                  <span className="text-label-sm text-on-surface-variant">
                    {wishCount} {wishCount === 1 ? "desire" : "desires"} • {reservedCount} reserved
                  </span>
                </div>
              </div>
              <span className="chip bg-surface-container text-secondary">Twofold Sync</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
