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
