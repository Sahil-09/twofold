"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentrySmokePage() {
  const [clicked, setClicked] = useState(false);

  const triggerClientError = () => {
    setClicked(true);
    // Deliberately throw an unhandled error so Sentry captures it.
    (window as unknown as { fn: () => void }).fn();
  };

  const triggerManual = async () => {
    try {
      throw new Error("Sentry smoke - manual capture");
    } catch (e) {
      Sentry.captureException(e);
    }
  };

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "520px" }}>
      <h1>Sentry smoke test</h1>
      <p>
        Click one of the buttons. If the SDK is wired up and NEXT_PUBLIC_SENTRY_DSN is set, an event
        will appear in your Sentry project.
      </p>
      <p>
        Open DevTools Network tab and filter for ingest.sentry.io to see the outgoing request.
      </p>
      <button
        onClick={triggerClientError}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          background: "#98434c",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Trigger unhandled client error
      </button>
      <button
        onClick={triggerManual}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          background: "#7d562d",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        Trigger manual capture
      </button>
      {clicked ? (
        <p style={{ color: "#ba1a1a" }}>
          The client error button threw; in production the page may advance to the error boundary, but
          Sentry still captures it.
        </p>
      ) : null}
    </div>
  );
}
