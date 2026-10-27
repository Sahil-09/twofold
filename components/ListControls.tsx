"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ListSort, ListState } from "@/lib/list";
import { PRIORITIES } from "@/lib/priority";
import type { Priority } from "@/lib/types";
import { Icon } from "./icons";

const SORTS: { value: ListSort; label: string }[] = [
  { value: "wanted", label: "Most wanted" },
  { value: "newest", label: "Newest first" },
  { value: "priceAsc", label: "Price: low to high" },
  { value: "priceDesc", label: "Price: high to low" },
];

type Filters = { priority: Priority | "all"; state: ListState; sort: ListSort };

/** The Stitch filter chip: a pill that lifts off the page, tinted while it holds a filter. */
function Select({
  label,
  value,
  onChange,
  active,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`relative flex items-center rounded-full shadow-rest transition-colors ${
        active ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-lowest text-on-surface-variant"
      }`}
    >
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer appearance-none rounded-full bg-transparent py-2.5 pl-3.5 pr-8 text-label-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {children}
      </select>
      <Icon
        name="chevronDown"
        className={`pointer-events-none absolute right-2.5 h-4 w-4 ${
          active ? "text-on-primary-fixed-variant" : "text-outline"
        }`}
      />
    </span>
  );
}

/** Search, filter and sort, written into the URL so a reload or a tab switch keeps them. */
export function ListControls({
  total,
  shown,
  q,
  priority,
  state,
  sort,
  showState,
  showPriceSort,
}: {
  total: number;
  shown: number;
  q: string;
  priority: Priority | "all";
  state: ListState;
  sort: ListSort;
  showState: boolean;
  showPriceSort: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [text, setText] = useState(q);

  // The URL lands a beat after the tap, so a second quick tap would read the old URL and drop
  // the first filter. The pending set lives here instead.
  const pending = useRef<Filters>({ priority, state, sort });

  function write(patch: Partial<Filters> & { q?: string }) {
    const next = { q: text.trim(), ...pending.current, ...patch };
    pending.current = { priority: next.priority, state: next.state, sort: next.sort };

    // Tab and anything else in the URL survive; the four controls are rewritten whole.
    const search = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all" || value === "wanted") search.delete(key);
      else search.set(key, value);
    }
    const query = search.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Keep the box and the pending set in step with back/forward.
  useEffect(() => {
    setText(q);
    pending.current = { priority, state, sort };
  }, [q, priority, state, sort]);

  // Type, then land on the URL after a pause instead of on every keystroke.
  useEffect(() => {
    if (text.trim() === q.trim()) return;
    const timer = setTimeout(() => write({ q: text.trim() }), 300);
    return () => clearTimeout(timer);
    // write reads the current text and merges whatever else was tapped.
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtering = Boolean(q.trim()) || priority !== "all" || state !== "all" || sort !== "wanted";

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 rounded-full bg-surface-lowest px-3.5 py-2.5 shadow-rest">
        <Icon name="search" className="h-4 w-4 shrink-0 text-outline" />
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search wishes, notes and shops"
          aria-label="Search wishes"
          className="w-full min-w-0 bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none"
          autoComplete="off"
        />
        {text ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setText("");
              write({ q: "" });
            }}
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-body-md text-outline"
          >
            ×
          </button>
        ) : null}
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          label="Filter by priority"
          value={priority}
          onChange={(value) => write({ priority: value as Priority | "all" })}
          active={priority !== "all"}
        >
          <option value="all">All priorities</option>
          {PRIORITIES.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.short}
            </option>
          ))}
        </Select>

        {showState ? (
          <Select
            label="Filter by plan"
            value={state}
            onChange={(value) => write({ state: value as ListState })}
            active={state !== "all"}
          >
            <option value="all">All wishes</option>
            <option value="planned">Planned by me</option>
            <option value="unplanned">Not planned</option>
          </Select>
        ) : null}

        <Select
          label="Sort wishes"
          value={sort}
          onChange={(value) => write({ sort: value as ListSort })}
          active={sort !== "wanted"}
        >
          {SORTS.filter((entry) => showPriceSort || !entry.value.startsWith("price")).map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </Select>

        {filtering ? (
          <button
            type="button"
            onClick={() => {
              setText("");
              write({ q: "", priority: "all", state: "all", sort: "wanted" });
            }}
            className="rounded-full bg-surface-container px-3.5 py-2.5 text-label-md font-semibold text-on-surface-variant transition-transform active:scale-95"
          >
            Clear
          </button>
        ) : null}
        {filtering ? (
          <span aria-live="polite" className="text-label-sm text-outline">
            {shown} of {total}
          </span>
        ) : null}
      </div>
    </div>
  );
}
