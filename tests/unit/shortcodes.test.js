import { test } from "node:test";
import assert from "node:assert/strict";
import { icon, placeholder, headingClass } from "../../lib/shortcodes.js";

test("icon returns inline Lucide SVG hidden from assistive tech", () => {
  const svg = icon("menu");
  assert.match(svg, /^<svg[^>]*class="icon icon-menu"/);
  assert.match(svg, /aria-hidden="true"/);
  assert.match(svg, /focusable="false"/);
  assert.doesNotMatch(svg, /role="img"/);
  assert.doesNotMatch(svg, /@license/);
  assert.match(svg, /<path d="M4 5h16"/);
});

test("icon with a label is exposed as an image with that name", () => {
  const svg = icon("external-link", "opens CPS site");
  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="opens CPS site"/);
  assert.doesNotMatch(svg, /aria-hidden/);
});

test("icon escapes the label", () => {
  assert.match(icon("x", 'a "b" <c>'), /aria-label="a &quot;b&quot; &lt;c&gt;"/);
});

test("icon falls back to project icons (instagram) and throws on unknown names", () => {
  assert.match(icon("instagram"), /class="icon icon-instagram"/);
  assert.throws(() => icon("no-such-icon"), /Unknown icon/);
});

test("placeholder renders the labeled striped box", () => {
  assert.equal(
    placeholder("Kids at recess", "3 / 2"),
    '<div class="ph" style="aspect-ratio:3 / 2" role="img" aria-label="Photo placeholder: Kids at recess"><span>Kids at recess</span></div>'
  );
  assert.match(placeholder("<b>", "1"), /aria-label="Photo placeholder: &lt;b&gt;"><span>&lt;b&gt;<\/span>/);
});

test("headingClass marks headings over eight words as long", () => {
  assert.equal(headingClass("Tiger news"), "");
  assert.equal(headingClass("one two three four five six seven eight"), "");
  assert.equal(headingClass("one two three four five six seven eight nine"), "long");
  assert.equal(headingClass("  spaced   out   words  "), "");
  assert.equal(headingClass(undefined), "");
});

test("linkPhrase links one phrase inside an escaped sentence, or appends the link", async () => {
  const { linkPhrase } = await import("../../lib/shortcodes.js");
  assert.equal(
    linkPhrase("No events — see the <CPS> calendar.", "see the <CPS> calendar", "https://x.test/?a=1&b=2"),
    'No events — <a href="https://x.test/?a=1&amp;b=2">see the &lt;CPS&gt; calendar</a>.'
  );
  assert.equal(linkPhrase("Sin eventos.", "calendario", "/c", "<svg></svg>"), 'Sin eventos. <a href="/c">calendario <svg></svg></a>');
});

test("placeholder takes an optional kind for non-photo stand-ins", () => {
  assert.match(placeholder("School location", "16 / 9", "Map"), /aria-label="Map placeholder: School location"/);
});

test("externalKind tells CPS sites from other sites; internal, mail and phone links are not external", async () => {
  const { externalKind } = await import("../../lib/shortcodes.js");
  assert.equal(externalKind("https://www.cps.edu/calendar/"), "cps");
  assert.equal(externalKind("https://aspen.cps.edu/"), "cps");
  assert.equal(externalKind("https://go.cps.edu"), "cps");
  assert.equal(externalKind("https://www.chicagoearlylearning.org"), "other");
  assert.equal(externalKind("https://notcps.edu.example.com/"), "other");
  assert.equal(externalKind("/staff/"), "");
  assert.equal(externalKind("mailto:a@cps.edu"), "");
  assert.equal(externalKind("tel:+17735345790"), "");
  assert.equal(externalKind(undefined), "");
});

test("docLink states the file type and size in the link's name", async () => {
  const { docLink } = await import("../../lib/shortcodes.js");
  const html = docLink({ cps: "opens CPS site", other: "opens another site" }, "LSC minutes, Oct 2026", "/files/m.pdf", "PDF", "220 KB");
  assert.match(html, /^<a class="doc-link" href="\/files\/m.pdf">/);
  assert.match(html, /<span class="doc-link__label">LSC minutes, Oct 2026 <span class="doc-link__meta">\(PDF, 220 KB\)<\/span><\/span>/);
  assert.match(html, /class="icon icon-file-text"/);
  assert.doesNotMatch(html, /icon-external-link/);
  const ext = docLink({ cps: "opens CPS site", other: "x" }, "A & B", "https://courtenay.cps.edu/a.pdf", "PDF");
  assert.match(ext, /A &amp; B <span class="doc-link__meta">\(PDF\)<\/span>/);
  assert.match(ext, /aria-label="opens CPS site"/);
});

test("callout wraps rendered HTML in one block with no blank lines", async () => {
  const { callout } = await import("../../lib/shortcodes.js");
  assert.equal(callout("<p>Due Friday.</p>\n\n<ul>\n<li>a</li>\n</ul>\n"), '<div class="callout"><p>Due Friday.</p>\n<ul>\n<li>a</li>\n</ul></div>');
  assert.match(callout("<p>x</p>", "Deadline"), /^<div class="callout"><p class="callout__title">Deadline<\/p><p>x<\/p><\/div>$/);
});
