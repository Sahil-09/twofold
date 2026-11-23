"use client";

import { useEffect } from "react";

/** Lands a push/activity tap on the right card, opening its notes when the tap came from a comment. */
export function ScrollToHash() {
  useEffect(() => {
    const note = new URLSearchParams(window.location.search).get("note");
    const target = document.getElementById(note ? `item-${note}` : window.location.hash.slice(1));
    if (!target) return;

    target.scrollIntoView({ block: "start" });
    // Setting open fires <details>' toggle event, which also refreshes the notes.
    if (note) target.querySelector("details")?.setAttribute("open", "");
  }, []);
  return null;
}
