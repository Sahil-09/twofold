import assert from "node:assert/strict";
import test from "node:test";
import { buildZenRowsUrl, fetchZenRows } from "../lib/zenrows.ts";

test("asks ZenRows for adaptive stealth instead of billing the expensive path", () => {
  const url = new URL(buildZenRowsUrl("https://www.flipkart.com/p/itm123", "key-123"));
  assert.equal(url.searchParams.get("mode"), "auto");
  assert.equal(url.searchParams.get("js_render"), null);
  assert.equal(url.searchParams.get("premium_proxy"), null);
  assert.equal(url.searchParams.get("url"), "https://www.flipkart.com/p/itm123");
  assert.equal(url.searchParams.get("apikey"), "key-123");
});

test("refuses a private link before any network call", async () => {
  const result = await fetchZenRows("http://127.0.0.1/admin");
  assert.equal(result.ok, false);
});

test("reports the missing key instead of throwing", async () => {
  const saved = process.env.ZENROWS_API_KEY;
  delete process.env.ZENROWS_API_KEY;
  try {
    const result = await fetchZenRows("https://example.com/p/1");
    assert.equal(result.ok, false);
    assert.match(result.ok === false ? result.error : "", /not configured/i);
  } finally {
    if (saved !== undefined) process.env.ZENROWS_API_KEY = saved;
  }
});
