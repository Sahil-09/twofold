"use client";

import { useState, useTransition } from "react";
import { setSetting, type SettingKey } from "@/app/actions/settings";

/** One switch for every preference. The state comes from the server on each render. */
export function SettingSwitch({
  setting,
  on,
  label,
  confirmOff,
}: {
  setting: SettingKey;
  on: boolean;
  label: string;
  /** Asked once when switching off, for preferences the user cannot un-see. */
  confirmOff?: string;
}) {
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();

  function toggle() {
    if (value && confirmOff && !window.confirm(confirmOff)) return;
    const next = !value;
    setValue(next);
    start(async () => {
      await setSetting(setting, next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={toggle}
      disabled={pending}
      className="switch mt-1"
    >
      <span className="switch-knob" />
    </button>
  );
}
