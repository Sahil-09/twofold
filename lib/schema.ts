import { z } from "zod";
import type { Priority } from "./types";

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/** Checkboxes arrive as "on" from FormData and as true from the JSON path. */
const checkbox = z.preprocess(
  (v) => v === true || v === "true" || v === "on" || v === "1",
  z.boolean(),
);

const optionalText = (max: number) =>
  z.preprocess(blank, z.string().trim().max(max).optional());

const optionalUrl = z.preprocess(blank, z.string().trim().url().max(2000).optional());

const optionalMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().nonnegative().max(100_000_000).optional(),
);

export const ItemInput = z.object({
  title: z.string().trim().min(1, "A title is required").max(200),
  url: optionalUrl,
  imageUrl: optionalUrl,
  note: optionalText(2000),
  priority: z.enum(["everyday", "toppick", "nice", "worth", "dream"]).default("everyday"),
  quantity: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 1 : Number(v)),
    z.number().int().min(1).max(99),
  ),
  occasionLabel: optionalText(60),
  occasionDate: z.preprocess(blank, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  targetPrice: optionalMoney,
  secret: checkbox,
  priceAmount: optionalMoney,
  priceCurrency: optionalText(3),
});

export type ItemInput = z.infer<typeof ItemInput>;

export const PRIORITY_VALUES = ["everyday", "toppick", "nice", "worth", "dream"] as const satisfies readonly Priority[];

export const LoginInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const ClaimInput = z.object({ itemId: z.string().min(1).max(100) });

export const SettingsInput = z.object({
  displayName: z.string().trim().min(1).max(60),
  theme: z.enum(["light", "dark", "system"]),
});
