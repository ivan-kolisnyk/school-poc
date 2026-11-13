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

test("every token DESIGN.md 5-7 and 12 names is defined", () => {
  const defined = new Set([...css.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]));
  const required = [
    // 5.1 primitives
    "navy", "navy-deep", "gold", "gold-text", "ink", "muted", "surface", "line", "white", "alert-red",
    // 5.2 semantic
    "color-text-primary", "color-text-secondary", "color-text-brand", "color-text-accent", "color-text-on-dark",
    "color-text-accent-on-dark", "color-text-on-accent", "color-surface-page", "color-surface-alt",
    "color-surface-brand", "color-surface-brand-strong", "color-surface-accent", "color-border-subtle",
    "color-border-control", "color-action-primary-bg", "color-action-primary-fg", "color-action-secondary-bg",
    "color-action-secondary-fg", "color-focus-on-light", "color-focus-on-dark", "color-status-emergency-bg",
    "color-status-emergency-fg", "color-status-error-fg",
    // 6 type
    "font-display", "font-body", "fs-display", "fs-h1", "fs-h2", "fs-h3", "fs-body", "fs-small", "fs-label",
    "lh-display", "lh-h1", "lh-h2", "lh-h3", "lh-body", "lh-small",
    // 7 layout
    "space-1", "space-2", "space-3", "space-4", "space-5", "space-6", "space-7", "space-8", "space-9",
    "radius-none", "radius-sm", "shadow-header", "z-header", "z-menu", "z-skip", "container-max", "gutter",
    // 12 motion
    "dur-fast", "dur-base", "dur-enter", "ease-out",
  ];
  assert.deepEqual(required.filter((n) => !defined.has(n)), []);
});

test("heading line-heights tighten on desktop (DESIGN.md 6: display 1.0 to 0.95, H1 1.05 to 1.0)", () => {
  const value = (block, name) => new RegExp(`--${name}:\\s*([0-9.]+)`).exec(block)?.[1];
  const base = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
  assert.equal(Number(value(base, "lh-display")), 1);
  assert.equal(Number(value(base, "lh-h1")), 1.05);
  const desktop = /@media \(min-width: 1024px\) \{([^@]*)\}\s*$/m.exec(css)?.[1] ?? "";
  assert.equal(Number(value(desktop, "lh-display")), 0.95, "display line-height at desktop");
  assert.equal(Number(value(desktop, "lh-h1")), 1, "H1 line-height at desktop");
});
