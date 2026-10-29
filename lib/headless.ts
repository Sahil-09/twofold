import chromiumBin from "@sparticuz/chromium";
import { chromium as pwChromium, type Browser } from "playwright-core";
import { existsSync } from "node:fs";
import { MAX_BYTES, type PageResult } from "@/lib/ssrf";

const fail = (error: string): PageResult => ({ ok: false, error });

const UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

/**
 * Renders a page with Chromium for shops that bot-check the plain fetch.
 *
 * Mirrors the working braen-api /attendance pattern: playwright-core drives the
 * browser, @sparticuz/chromium ships the binary on Vercel. playwright-core runs
 * headless off-screen (no display dependency — the failure mode that drove the
 * puppeteer-core path down in Vercel's headless container).
 *
 * shortcut: local dev relies on a `playwright install chromium` cache; if absent
 * we fall back to a system browser on Windows (dev only). Vercel always uses
 * the bundled binary. Fresh browser per request (matches braen) — adds 3-8s but
 * avoids the warm-container disconnected-browser trap.
 */
export async function fetchRendered(rawUrl: string): Promise<PageResult> {
  try {
    new URL(rawUrl);
  } catch {
    return fail("That link points somewhere private.");
  }

  let browser: Browser | undefined;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 800 }, locale: "en-IN" });
    const page = await context.newPage();
    try {
      await page.goto(rawUrl, { waitUntil: "commit", timeout: 30_000 });
      // Savana/Meesho-style SPAs hydrate after load; give them a brief runway.
      await page.waitForTimeout(1_500);
      try {
        await page.waitForLoadState("networkidle", { timeout: 10_000 });
      } catch {
        // Ignore — read whatever we have.
      }
      let html = await page.content();
      // Myntra occasionally aborts the HTTP/2 stream (net::ERR_HTTP2_PROTOCOL_ERROR).
      // When that happens, still try to read whatever the renderer received.
      if (!/dram|<h1/i.test(html)) {
        await page.waitForTimeout(2_000);
        try {
          html = await page.content();
        } catch {
          // leave as-is
        }
      }
      const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
      if (/site maintenance/i.test(html) || /site maintenance/i.test(title)) {
        // Myntra/Akamai occasionally serve a maintenance gate on first request;
        // reload after a short wait before bailing.
        await page.waitForTimeout(3_000);
        try {
          await page.reload({ waitUntil: "load", timeout: 30_000 });
        } catch {
          // fall through with original HTML
        }
        await page.waitForTimeout(1_500);
      }
      const finalUrl = page.url();
      return { ok: true, html: html.slice(0, MAX_BYTES), finalUrl };
    } finally {
      await page.close();
      await context.close();
    }
  } catch (error) {
    console.error("fetchRendered failed", error);
    return fail("That page wouldn't render for us.");
  } finally {
    await browser?.close();
  }
}

function findLocalBrowser(): string | undefined {
  const candidates =
    process.platform === "win32"
      ? [
          "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
          "C:/Program Files/Google/Chrome/Application/chrome.exe",
          "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
        ];
  return candidates.find((candidate) => existsSync(candidate));
}

async function launchBrowser(): Promise<Browser> {
  if (!process.env.VERCEL) {
    try {
      return await pwChromium.launch({ headless: true });
    } catch (err) {
      const local = findLocalBrowser();
      if (!local) throw err;
      return pwChromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled", "--disable-http2"],
        executablePath: local,
      });
    }
  }

  const cb = chromiumBin;
  return pwChromium.launch({
    headless: true,
    args: [...cb.args, "--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled", "--disable-http2"],
    executablePath: await cb.executablePath(),
  });
}
