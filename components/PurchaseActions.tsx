"use client";

import type { FormEvent } from "react";
import { boughtAction, unclaimAction } from "@/app/actions/claims";
import { Icon } from "./icons";

export function PurchaseActions({ itemId }: { itemId: string }) {
  function burst(event: FormEvent<HTMLFormElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    // Read the token so the burst follows the theme (light/dark) instead of hard-coding a hex.
    const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
    void import("canvas-confetti").then(({ default: confetti }) =>
      confetti({
        particleCount: 185,
        spread: 90,
        scalar: 0.8,
        ticks: 120,
        disableForReducedMotion: true,
        colors: primary ? [primary,'#FFFFF'] : undefined,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: rect.top / window.innerHeight,
        },
      }),
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <form action={boughtAction} onSubmit={burst}>
        <input type="hidden" name="itemId" value={itemId} />
        <button
          type="submit"
          aria-label="Mark as purchased"
          className="btn-primary h-11 w-full text-label-md"
        >
          <Icon name="checkCircle" className="h-4 w-4" />
          Purchased
        </button>
      </form>

      <form action={unclaimAction}>
        <input type="hidden" name="itemId" value={itemId} />
        <button
          type="submit"
          aria-label="Release — not buying this"
          className="btn-ghost h-11 w-full text-label-md"
        >
          Release
        </button>
      </form>
    </div>
  );
}
