import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../../src/css/tokens.css", import.meta.url), "utf8");
const prim = {};
const semantic = {};
for (const [, name, value] of css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
  if (/^#[0-9a-f]{6}$/i.test(value.trim())) prim[name] = value.trim();
  else if (name.startsWith("color-")) semantic[name] = value.trim();
}

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(prim[a]), lum(prim[b])].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const pairs = [
  ["ink", "white", 17.56], ["muted", "white", 7.96], ["muted", "surface", 7.3],
  ["navy", "white", 13.21], ["navy", "surface", 12.11], ["white", "navy", 13.21],
  ["white", "navy-deep", 16.29], ["gold", "navy", 8.66], ["gold", "navy-deep", 10.68],
  ["navy-deep", "gold", 10.68], ["gold-text", "white", 5.87], ["gold-text", "surface", 5.39],
  ["white", "alert-red", 6.57],
];
for (const [fg, bg, expected] of pairs) {
  test(`${fg} on ${bg} is ${expected}:1 and >= 4.5`, () => {
    const r = ratio(fg, bg);
    assert.ok(Math.abs(r - expected) <= 0.05, `got ${r.toFixed(2)}`);
    assert.ok(r >= 4.5);
  });
}

test("gold on white fails as text (guard)", () => {
  assert.ok(ratio("gold", "white") < 3);
});

test("every semantic token resolves to a primitive", () => {
  const names = Object.keys(semantic);
  assert.ok(names.length >= 22, `found ${names.length}`);
  for (const [n, v] of Object.entries(semantic)) {
    const m = v.match(/^var\(--([a-z0-9-]+)\)$/);
    assert.ok(m && prim[m[1]], `${n} -> ${v}`);
  }
});
