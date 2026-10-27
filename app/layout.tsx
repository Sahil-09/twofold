import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import { isTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Twofold",
  description: "Two wishlists, one place.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Twofold", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a141a" },
  ],
};

const themeScript = `(function(){try{var t=document.documentElement.dataset.theme;var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cookie only: a database read here used to hold back every navigation's first paint.
  const remembered = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isTheme(remembered) ? remembered : "system";

  return (
    <html
      lang="en"
      data-theme={theme}
      className={theme === "dark" ? "dark" : undefined}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body className={`${jakarta.variable} font-sans`}>{children}</body>
    </html>
  );
}
