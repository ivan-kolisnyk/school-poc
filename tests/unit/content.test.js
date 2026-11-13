// Editor-written content made safe for the page: rich-text headings and CMS link fields.
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeHeadings, safeHref, imageRefs } from "../../lib/content.js";

const levels = (html) => [...html.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));

test("normalizeHeadings: a pasted H1 becomes an h2 under the page h1", () => {
  assert.equal(normalizeHeadings("<h1>Thank you</h1><p>x</p>", 1), "<h2>Thank you</h2><p>x</p>");
});

test("normalizeHeadings: skipped levels close up, one step at a time", () => {
  const html = "<h2>A</h2><h4 id=\"b\">B</h4><h6>C</h6><h2>D</h2><h3>E</h3>";
  assert.equal(normalizeHeadings(html, 1), "<h2>A</h2><h3 id=\"b\">B</h3><h4>C</h4><h2>D</h2><h3>E</h3>");
});

test("normalizeHeadings: under an h2 (the homepage welcome) bodies start at h3", () => {
  assert.deepEqual(levels(normalizeHeadings("<h1>W</h1><h4>X</h4><h2>Y</h2>", 2)), [3, 4, 3]);
});

test("normalizeHeadings: well-formed bodies are unchanged; never deeper than h6", () => {
  const ok = "<h2>A</h2><h3>B</h3><h2 class=\"x\">C</h2>";
  assert.equal(normalizeHeadings(ok, 1), ok);
  assert.deepEqual(levels(normalizeHeadings("<h2>a</h2><h3>b</h3><h4>c</h4><h5>d</h5><h6>e</h6><h6>f</h6>", 5)), [6, 6, 6, 6, 6, 6]);
  assert.equal(normalizeHeadings("", 1), "");
  assert.equal(normalizeHeadings(undefined, 1), "");
});

test("normalizeHeadings: the result never has an h1 and never skips a level", () => {
  const html = "<h4>a</h4><h1>b</h1><h6>c</h6><h3>d</h3><h1>e</h1><h5>f</h5>";
  const out = levels(normalizeHeadings(html, 1));
  let prev = 1;
  for (const l of out) {
    assert.ok(l >= 2 && l <= prev + 1, `h${l} after h${prev}`);
    prev = l;
  }
});

test("safeHref: full web addresses, site paths, mailto and tel pass (trimmed)", () => {
  for (const ok of ["https://www.cps.edu/", "http://example.org/x", "/news/", "/about/principal/#top", "mailto:a@cps.edu", "tel:+17735345790"]) {
    assert.equal(safeHref(ok), ok);
  }
  assert.equal(safeHref("  /news/ "), "/news/");
  assert.equal(safeHref("HTTPS://WWW.CPS.EDU/"), "HTTPS://WWW.CPS.EDU/");
});

test("safeHref: anything else is dropped", () => {
  for (const bad of ["javascript:alert(1)", " JavaScript:alert(1)", "//evil.example/", "news/", "www.cps.edu", "data:text/html,x", "", "   ", undefined, null]) {
    assert.equal(safeHref(bad), "", String(bad));
  }
});

test("imageRefs: Markdown and HTML images in a body", () => {
  const body = 'Text ![A cat](/images/cat.jpg "Cat") and <img alt="x" src="/images/dog.png"> and ![](<my photo.jpg>)';
  assert.deepEqual(imageRefs(body).map((r) => r.src), ["/images/cat.jpg", "my photo.jpg", "/images/dog.png"]);
  for (const r of imageRefs(body)) assert.ok(body.includes(r.match));
});
