import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";
import { existsSync } from "node:fs";
import { MAX_BYTES, type PageResult } from "@/lib/ssrf";

const fail = (error: string): PageResult => ({ ok: false, error });

/**
 * Renders a page with real Chromium for shops that bot-check the plain fetch
 * (Flipkart, Myntra…). Reuses one browser per warm function; a failed render
 * (cold-start extraction, OOM) is a normal failure, never an exception.
 * shortcut: Chromium makes its own outbound connections, so the SSRF per-hop DNS
 * re-check of lib/ssrf.ts does not apply here — acceptable because only the two
 * seeded accounts can ever pass a URL in.
 */
export async function fetchRendered(rawUrl: string): Promise<PageResult> {
  try {
    new URL(rawUrl);
  } catch {
    return fail("That link points somewhere private.");
  }

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0 Safari/537.36",
      );
      await page.goto(rawUrl, { waitUntil: "load", timeout: 30_000 });
      // Savana/Meesho-style SPAs hydrate after load; give them a brief runway.
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await page.waitForNetworkIdle({ idleTime: 1_000, timeout: 10_000 }).catch(() => {});
      const html = await page.content();
      const finalUrl = page.url();
      return { ok: true, html: html.slice(0, MAX_BYTES), finalUrl };
    } finally {
      await page.close();
    }
  } catch (error) {
    // The browser may have died mid-render — drop it so the next call relaunches.
    browser = undefined;
    console.error("fetchRendered failed", error);
    return fail("That page wouldn't render for us.");
  }
}

let browser: Promise<Browser> | undefined;

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
  try {
    return candidates.find((candidate) => existsSync(candidate));
  } catch {
    return undefined;
  }
}

function getBrowser(): Promise<Browser> {
  browser ??= (async () => {
    try {
      const executablePath = await chromium.executablePath();
      return await puppeteer.launch({
        args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
        defaultViewport: { width: 1280, height: 800 },
        executablePath,
        headless: "shell",
      });
    } catch (error) {
      if (process.platform === "linux") throw error;
      const local = findLocalBrowser();
      if (!local) throw error;
      return await puppeteer.launch({
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
        defaultViewport: { width: 1280, height: 800 },
        executablePath: local,
        headless: "shell",
      });
    }
  })().catch((error) => {
    browser = undefined;
    throw error;
  });
  return browser;
}
