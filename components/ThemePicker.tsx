"use client";

import { useState, useTransition } from "react";
import { setTheme } from "@/app/actions/settings";
import type { Theme } from "@/lib/types";
import { Icon, type IconName } from "./icons";

const options: { key: Theme; label: string; icon: IconName }[] = [
  { key: "light", label: "Light", icon: "sun" },
  { key: "dark", label: "Dark", icon: "moon" },
  { key: "system", label: "System", icon: "monitor" },
];

export function ThemePicker({ value }: { value: Theme }) {
  const [chosen, setChosen] = useState<Theme>(value);
  const [pending, start] = useTransition();

  function choose(theme: Theme) {
    const dark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = theme;
    setChosen(theme);
    start(async () => {
      await setTheme(theme);
    });
  }

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-full bg-surface-container p-1"
      role="group"
      aria-label="Appearance"
    >
      {options.map((option) => {
        const active = chosen === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => choose(option.key)}
            aria-pressed={active}
            disabled={pending}
            className={`flex items-center justify-center gap-2 rounded-full py-2 text-label-md font-semibold transition-all ${
              active
                ? "bg-surface-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name={option.icon} className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
