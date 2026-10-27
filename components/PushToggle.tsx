"use client";

import { useEffect, useState, useTransition } from "react";
import { subscribeAction, unsubscribeAction } from "@/app/actions/settings";

const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

type State = "checking" | "on" | "off" | "unsupported" | "blocked";

export function PushToggle() {
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("blocked");
      return;
    }
    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then(async (registration) => {
        const subscription = await registration?.pushManager.getSubscription();
        setState(subscription ? "on" : "off");
      })
      .catch(() => setState("off"));
  }, []);

  function enable() {
    setError(null);
    start(async () => {
      if (!vapidKey) {
        setError("Push isn't configured on this deployment.");
        return;
      }
      try {
        const registration =
          (await navigator.serviceWorker.getRegistration("/sw.js")) ??
          (await navigator.serviceWorker.register("/sw.js"));
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "blocked" : "off");
          return;
        }
        const subscription =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          }));
        const result = await subscribeAction(subscription.toJSON());
        setState(result.ok ? "on" : "off");
        if (!result.ok) setError("That subscription looked wrong. Try again.");
      } catch {
        setError("Couldn't enable notifications on this device.");
      }
    });
  }

  function disable() {
    setError(null);
    start(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await unsubscribeAction(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setState("off");
      } catch {
        setError("Couldn't turn notifications off.");
      }
    });
  }

  if (state === "unsupported" || state === "blocked") {
    return (
      <p className="mt-1 max-w-[14rem] text-right text-label-sm text-outline">
        {state === "unsupported"
          ? "This browser can't do notifications. On iPhone, add Twofold to your Home Screen first."
          : "Notifications are blocked for Twofold. Allow them in your browser settings, then reload."}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={state === "on"}
        aria-label="Price drop alerts"
        onClick={state === "on" ? disable : enable}
        disabled={pending || state === "checking"}
        className="switch mt-1"
      >
        <span className="switch-knob" />
      </button>

      {state === "checking" ? <span className="text-label-sm text-outline">Checking…</span> : null}

      {error ? (
        <p role="alert" className="max-w-[10rem] text-right text-label-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

