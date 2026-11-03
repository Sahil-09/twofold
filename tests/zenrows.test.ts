import assert from "node:assert/strict";
import test from "node:test";
import { buildZenRowsUrl, fetchZenRows, OUT_OF_CREDITS, zenRowsError } from "../lib/zenrows.ts";
import { draftFromExtract, draftFromPage, isGateTitle } from "../lib/parse.ts";

test("asks ZenRows for adaptive stealth instead of billing the expensive path", () => {
  const url = new URL(buildZenRowsUrl("https://www.flipkart.com/p/itm123", "key-123", false));
  assert.equal(url.searchParams.get("mode"), "auto");
  assert.equal(url.searchParams.get("js_render"), null);
  assert.equal(url.searchParams.get("premium_proxy"), null);
  assert.equal(url.searchParams.get("extract"), null);
  assert.equal(url.searchParams.get("url"), "https://www.flipkart.com/p/itm123");
  assert.equal(url.searchParams.get("apikey"), "key-123");
});

test("only prepared hosts get the extract parameter", () => {
  const url = new URL(buildZenRowsUrl("https://www.flipkart.com/p/itm123", "key-123", true));
  assert.equal(url.searchParams.get("extract"), "auto");
});

test("says so plainly when the month's credits are gone", () => {
  assert.equal(zenRowsError(402), OUT_OF_CREDITS);
  assert.equal(zenRowsError(429), OUT_OF_CREDITS);
  assert.match(zenRowsError(500), /500/);
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

// Shape captured from a real Flipkart product page.
const flipkart = {
  delivery: { shipping_destination_country: "IN" },
  pricing: {
    // Flipkart's own extraction puts the page title here, not a currency code.
    currency: "Ganpati Arts Oslo Solid Sheesham Wood Sofa - Buy online at Flipkart.com",
    effective_price_after_offers: 11159,
    emi_per_month: 4251,
    selling_price: 12399,
  },
  product: {
    canonical_url: "https://www.flipkart.com/x/p/itmd79d38145c645",
    name: "Ganpati Arts Oslo Solid Sheesham Wood Sofa/Couch With Side Pocket... more",
    primary_image: "https://rukminim2.flixcart.com/image/300/300/xif0q/sofa.jpeg",
    sku: "SOFGZRR6HWZNFS7S",
  },
  seller: { name: "Ganpati Arts", rating: 3.6 },
};

test("reads a Flipkart extract payload: selling price, not EMI or bank-offer price", () => {
  const draft = draftFromExtract(flipkart);
  assert.equal(draft.priceAmount, 12399);
  assert.equal(draft.imageUrl, "https://rukminim2.flixcart.com/image/300/300/xif0q/sofa.jpeg");
  assert.equal(draft.title, "Ganpati Arts Oslo Solid Sheesham Wood Sofa/Couch With Side Pocket");
  // A title in the currency field must not become the currency.
  assert.equal(draft.priceCurrency, undefined);
});

test("returns nothing rather than a wrong number when extract found no price", () => {
  const draft = draftFromExtract({ product: { name: "Vase" }, pricing: { currency: "INR" } });
  assert.equal(draft.priceAmount, undefined);
  assert.equal(draft.priceCurrency, "INR");
});

test("prefers the extract price over the HTML guess, and the HTML title over the truncated one", () => {
  const html = `<html><head><meta property="og:title" content="Ganpati Arts Oslo Sofa"></head></html>`;
  const draft = draftFromPage({
    ok: true,
    html,
    finalUrl: "https://www.flipkart.com/x/p/itmd79d38145c645",
    parsed: flipkart,
  });
  assert.equal(draft?.title, "Ganpati Arts Oslo Sofa");
  assert.equal(draft?.priceAmount, 12399);
  // Extract's 300px thumbnail is rewritten to Flipkart's large one.
  assert.equal(draft?.imageUrl, "https://rukminim2.flixcart.com/image/832/832/xif0q/sofa.jpeg");
});

test("treats a shop's block page as a failed read", () => {
  assert.equal(isGateTitle("Online Shopping India | Buy Mobiles, Electronics"), true);
  assert.equal(isGateTitle("Ganpati Arts Oslo Solid Sheesham Wood Sofa"), false);
  assert.equal(isGateTitle(undefined), false);
});
