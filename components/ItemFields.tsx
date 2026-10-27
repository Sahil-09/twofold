"use client";

import { useState } from "react";
import { PRIORITIES } from "@/lib/priority";
import { Icon } from "./icons";

export type ItemFieldsDefaults = {
  title?: string;
  url?: string;
  imageUrl?: string;
  priceAmount?: number;
  priceCurrency?: string;
  priority?: "dream" | "high" | "essential" | "nice";
  quantity?: number;
  occasionLabel?: string;
  occasionDate?: string;
  targetPrice?: number;
  note?: string;
  secret?: boolean;
};

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center justify-between text-label-md uppercase tracking-wider text-on-surface-variant"
      >
        <span>{label}</span>
        {hint ? <span className="text-label-sm lowercase text-outline">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

export function ItemFields({
  defaults,
  partnerName = "your partner",
}: {
  defaults?: ItemFieldsDefaults;
  partnerName?: string;
}) {
  const [quantity, setQuantity] = useState(defaults?.quantity ?? 1);
  const [secret, setSecret] = useState(defaults?.secret ?? false);

  const currency = (defaults?.priceCurrency ?? "INR").toUpperCase();
  const currencies = CURRENCIES.includes(currency) ? CURRENCIES : [currency, ...CURRENCIES];

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="url" value={defaults?.url ?? ""} />
      <input type="hidden" name="imageUrl" value={defaults?.imageUrl ?? ""} />

      <Field label="What is it" htmlFor="title" hint="editable">
        <div className="field-card">
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            defaultValue={defaults?.title ?? ""}
            className="w-full bg-transparent text-title-md text-on-surface outline-none placeholder:text-outline"
            placeholder="Linen robe, size M"
          />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price" htmlFor="priceAmount">
          <div className="field-card">
            <input
              id="priceAmount"
              name="priceAmount"
              inputMode="decimal"
              defaultValue={defaults?.priceAmount ?? ""}
              className="w-full bg-transparent text-title-md font-semibold text-on-surface outline-none placeholder:text-outline"
              placeholder="0"
            />
          </div>
        </Field>

        <Field label="Currency" htmlFor="priceCurrency">
          <div className="field-card relative flex items-center">
            <select
              id="priceCurrency"
              name="priceCurrency"
              defaultValue={currency}
              className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-title-md text-on-surface outline-none"
            >
              {currencies.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <Icon
              name="chevronDown"
              className="pointer-events-none absolute right-3 h-4 w-4 text-outline"
            />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority" htmlFor="priority">
          <div className="field-card relative flex items-center">
            <select
              id="priority"
              name="priority"
              defaultValue={defaults?.priority ?? "nice"}
              className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-body-md text-on-surface outline-none"
            >
              {PRIORITIES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
            <Icon
              name="chevronDown"
              className="pointer-events-none absolute right-3 h-4 w-4 text-outline"
            />
          </div>
        </Field>

        <Field label="How many" htmlFor="quantity">
          <div className="field-card flex items-center justify-between">
            <button
              type="button"
              aria-label="One fewer"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-7 w-7 place-items-center rounded-full bg-surface-container text-on-surface-variant active:scale-90"
            >
              <Icon name="minus" className="h-3.5 w-3.5" />
            </button>
            <span aria-live="polite" className="text-title-md font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="One more"
              onClick={() => setQuantity((value) => Math.min(99, value + 1))}
              className="grid h-7 w-7 place-items-center rounded-full bg-surface-container text-on-surface-variant active:scale-90"
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
            </button>
          </div>
          <input type="hidden" id="quantity" name="quantity" value={quantity} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Occasion" htmlFor="occasionLabel">
          <div className="field-card">
            <input
              id="occasionLabel"
              name="occasionLabel"
              list="occasion-labels"
              maxLength={60}
              defaultValue={defaults?.occasionLabel ?? ""}
              className="w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
              placeholder="Birthday"
            />
            <datalist id="occasion-labels">
              <option value="Birthday" />
              <option value="Anniversary" />
              <option value="Holiday Season" />
              <option value="Just Because" />
            </datalist>
          </div>
        </Field>

        <Field label="By when" htmlFor="occasionDate">
          <div className="field-card">
            <input
              id="occasionDate"
              name="occasionDate"
              type="date"
              defaultValue={defaults?.occasionDate ?? ""}
              className="w-full bg-transparent text-body-md text-on-surface outline-none"
            />
          </div>
        </Field>
      </div>

      <Field label={`Note for ${partnerName}`} htmlFor="note">
        <div className="field-card">
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={2000}
            defaultValue={defaults?.note ?? ""}
            className="w-full resize-none bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
            placeholder="Colour, size, scent preferences, or which shelf we saw it on…"
          />
        </div>
      </Field>

      <Field label="Notify me if price drops below" htmlFor="targetPrice">
        <div className="field-card flex items-center gap-2">
          <span className="text-body-md text-outline">
            {currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
          </span>
          <input
            id="targetPrice"
            name="targetPrice"
            inputMode="decimal"
            defaultValue={defaults?.targetPrice ?? ""}
            className="w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
            placeholder="e.g. 850 (optional)"
          />
        </div>
      </Field>

      <div className="field-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
            <Icon name="lock" className="h-4 w-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-title-md font-medium leading-snug">Secret Surprise Vault</span>
            <span className="text-label-sm text-on-surface-variant">
              Conceal from {partnerName} until revealed
            </span>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={secret}
          aria-label="Secret Surprise Vault"
          onClick={() => setSecret((value) => !value)}
          className="switch"
        >
          <span className="switch-knob" />
        </button>
        <input type="hidden" name="secret" value={secret ? "on" : ""} />
      </div>
    </div>
  );
}
