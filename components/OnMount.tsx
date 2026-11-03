"use client";

import { useEffect } from "react";

/** Runs a server action once when the screen mounts — the only honest place for a "seen" stamp. */
export function OnMount({ action }: { action: () => Promise<void> }) {
  useEffect(() => {
    void action();
  }, [action]);
  return null;
}
