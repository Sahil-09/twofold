import assert from "node:assert/strict";
import test from "node:test";
import { normalizeLink, parseProduct, titleFromUrl, toNumber } from "../lib/parse.ts";

test("reads a schema.org Product with offers", () => {
  const html = `
    <html><head>
      <script type="application/ld+json">
        {"@context":"https://schema.org","@graph":[
          {"@type":"BreadcrumbList"},
          {"@type":"Product","name":"Linen Robe","image":["https://cdn.shop/img.jpg"],
           "offers":{"@type":"Offer","price":"1299.00","priceCurrency":"INR"}}
        ]}
      </script>
    </head></html>`;

  const draft = parseProduct(html, "https://shop.example/p/robe");
  assert.equal(draft.title, "Linen Robe");
  assert.equal(draft.imageUrl, "https://cdn.shop/img.jpg");
  assert.equal(draft.priceAmount, 1299);
  assert.equal(draft.priceCurrency, "INR");
});

test("falls back to OpenGraph when there is no JSON-LD", () => {
  const html = `
    <html><head>
      <meta property="og:title" content="Wool Throw &amp; More">
      <meta property="og:image" content="/images/throw.jpg">
      <meta property="product:price:amount" content="89.5">
      <meta property="product:price:currency" content="eur">
    </head></html>`;

  const draft = parseProduct(html, "https://shop.example/p/throw");
  assert.equal(draft.title, "Wool Throw & More");
  assert.equal(draft.imageUrl, "https://shop.example/images/throw.jpg");
  assert.equal(draft.priceAmount, 89.5);
  assert.equal(draft.priceCurrency, "EUR");
});

test("keeps a Product that has no offer", () => {
  const html = `<script type="application/ld+json">
    {"@type":"Product","name":"Ghost Mug"}
  </script>`;

  const draft = parseProduct(html, "https://shop.example/ghost");
  assert.equal(draft.title, "Ghost Mug");
  assert.equal(draft.priceAmount, undefined);
});

test("survives a page with nothing useful", () => {
  const draft = parseProduct("<html><body>hello</body></html>", "https://shop.example/");
  assert.deepEqual(draft, {
    title: undefined,
    imageUrl: undefined,
    priceAmount: undefined,
    priceCurrency: undefined,
  });
});

test("survives broken JSON-LD", () => {
  const html = `<script type="application/ld+json">{ not json </script>
    <title>Plain Title</title>`;
  const draft = parseProduct(html, "https://shop.example/");
  assert.equal(draft.title, "Plain Title");
});

test("reads European and thousands-separated prices", () => {
  assert.equal(toNumber("1.299,00 €"), 1299);
  assert.equal(toNumber("$1,299.00"), 1299);
  assert.equal(toNumber("89,5"), 89.5);
  assert.equal(toNumber("free"), undefined);
  assert.equal(toNumber(12), 12);
});

test("falls back to Amazon's gallery image and offscreen price", () => {
  const html = `
    <html><head>
      <title>DROGO Feather Node Office Chair : Amazon.in: Home &amp; Kitchen</title>
    </head><body>
      <img id="landingImage" src="https://m.media-amazon.com/images/I/413zQfvop3L._SY300_.jpg">
      <span class="a-price"><span class="a-offscreen">₹12,499.00</span><span aria-hidden="true">₹12,499</span></span>
      <div data-a-dynamic-image="{&quot;https://m.media-amazon.com/images/I/7125LCcVS-L._SY355_.jpg&quot;:[355,355]}"></div>
    </body></html>`;

  const draft = parseProduct(html, "https://www.amazon.in/dp/B0HC3PWD6X");
  assert.equal(draft.title, "DROGO Feather Node Office Chair");
  assert.equal(draft.imageUrl, "https://m.media-amazon.com/images/I/7125LCcVS-L._SY355_.jpg");
  assert.equal(draft.priceAmount, 12499);
  assert.equal(draft.priceCurrency, "INR");
});

test("falls back to the landing image when the gallery JSON is absent", () => {
  const html = `<title>Something : Amazon.in</title>
    <img id="landingImage" src="https://m.media-amazon.com/images/I/a.jpg">`;
  const draft = parseProduct(html, "https://www.amazon.in/dp/X1");
  assert.equal(draft.title, "Something");
  assert.equal(draft.imageUrl, "https://m.media-amazon.com/images/I/a.jpg");
});

test("strips Amazon's title wrapper instead of slicing it mid-sentence", () => {
  const html = `<title>Amazon.in: Buy Logitech Signature M850 L Wireless Mouse Online at Low Prices in India | Logitech Reviews &amp; Ratings</title>`;
  const draft = parseProduct(html, "https://www.amazon.in/dp/B0H4R8YMH4");
  assert.equal(draft.title, "Logitech Signature M850 L Wireless Mouse");
});

test("keeps a separator that is part of the product name", () => {
  const html = `<title>Salt &amp; Pepper Grinder | Home : Amazon.in</title>`;
  const draft = parseProduct(html, "https://www.amazon.in/dp/X2");
  assert.equal(draft.title, "Salt & Pepper Grinder | Home");
});

test("finds a link inside pasted share text", () => {
  assert.equal(
    normalizeLink("Look at this https://shop.example/p/robe?utm=1, love it"),
    "https://shop.example/p/robe?utm=1",
  );
  assert.equal(normalizeLink("www.amazon.in/dp/B0CHX1W1XY"), "https://www.amazon.in/dp/B0CHX1W1XY");
  assert.equal(normalizeLink("  https://x.com/a  "), "https://x.com/a");
  assert.equal(normalizeLink("just some words"), undefined);
  assert.equal(normalizeLink(""), undefined);
});

test("builds a readable title from a product URL", () => {
  assert.equal(
    titleFromUrl("https://shop.example/products/linen-robe-natural"),
    "Linen Robe Natural",
  );
  assert.equal(titleFromUrl("https://shop.example/p/2360874"), undefined);
  assert.equal(titleFromUrl("https://shop.example/"), undefined);
});
