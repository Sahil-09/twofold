import { cookies } from "next/headers";
import type { Theme } from "./types";

/**
 * The layout needs the theme on every navigation, but it must not read the database to get it —
 * that wait blocked the whole document. The cookie is written by login and by the theme picker.
 */
export const THEME_COOKIE = "twofold_theme";

export const isTheme = (value: string | undefined): value is Theme =>
  value === "light" || value === "dark" || value === "system";

export async function rememberTheme(theme: Theme): Promise<void> {
  (await cookies()).set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
  });
}
