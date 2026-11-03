"use client";

import { useEffect, useRef } from "react";

/**
 * Runs a server action once per mount — the only honest place for a "seen" stamp.
 * The ref guard is load-bearing: a server-action prop gets a new identity on every RSC render, so
 * keying the effect on it re-fired the action, which revalidated, which re-rendered.
 */
export function OnMount({ action }: { action: () => Promise<void> }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void action();
  }, [action]);
  return null;
}
