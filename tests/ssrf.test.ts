import assert from "node:assert/strict";
import test from "node:test";
import { isPublicAddress, readCapped } from "../lib/ssrf.ts";

test("stops reading a huge page at the cap instead of failing", async () => {
  const chunk = new Uint8Array(1_000_000).fill(97);
  const body = new ReadableStream({
    start(controller) {
      for (let i = 0; i < 3; i += 1) controller.enqueue(chunk);
      controller.close();
    },
  });

  const html = await readCapped(new Response(body));
  assert.equal(html.length, 2_000_000);
  assert.equal(html[0], "a");
});

test("reads a small page whole", async () => {
  const html = await readCapped(new Response("<html>hi</html>"));
  assert.equal(html, "<html>hi</html>");
});

test("blocks local, private and metadata addresses", () => {
  for (const address of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.9",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:192.168.1.1",
  ]) {
    assert.equal(isPublicAddress(address), false, address);
  }
});

test("allows ordinary public addresses", () => {
  assert.equal(isPublicAddress("93.184.216.34"), true);
  assert.equal(isPublicAddress("2606:2800:220:1:248:1893:25c8:1946"), true);
});

test("rejects anything that is not an address", () => {
  assert.equal(isPublicAddress("localhost"), false);
  assert.equal(isPublicAddress("example.com"), false);
});
