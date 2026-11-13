import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Lucide first; project icons (e.g. Instagram, which Lucide no longer ships) second.
const iconDirs = [
  path.join(root, "node_modules/lucide-static/icons"),
  path.join(root, "src/_includes/icons"),
];
const cache = new Map();

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function loadIcon(name) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Unknown icon "${name}"`);
  if (!cache.has(name)) {
    const file = iconDirs.map((d) => path.join(d, `${name}.svg`)).find(existsSync);
    if (!file) throw new Error(`Unknown icon "${name}"`);
    const svg = readFileSync(file, "utf8")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s*\n\s*/g, " ")
      .replace(/>\s+</g, "><")
      .trim();
    // Keep the drawing; the opening tag is rebuilt below.
    cache.set(name, svg.replace(/^<svg[^>]*>/, ""));
  }
  return cache.get(name);
}

/** Inline Lucide SVG. Decorative unless a label is given. */
export function icon(name, label) {
  const body = loadIcon(name);
  const a11y = label
    ? `role="img" aria-label="${escapeHtml(label)}"`
    : `aria-hidden="true"`;
  return `<svg class="icon icon-${name}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false" ${a11y}>${body}`;
}

/** Labeled striped box standing in for a photo (DESIGN.md section 9). */
export function placeholder(label, ratio) {
  const l = escapeHtml(label);
  return `<div class="ph" style="aspect-ratio:${escapeHtml(ratio)}" role="img" aria-label="Photo placeholder: ${l}"><span>${l}</span></div>`;
}

/** "long" for headings over eight words: they drop uppercase (DESIGN.md section 6). */
export function headingClass(text) {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  return words.length > 8 ? "long" : "";
}

/**
 * A sentence from strings with one phrase in it turned into a link, so translators keep the
 * whole sentence. If a translation drops the phrase, the link follows the sentence.
 * `suffixHtml` (trusted markup, e.g. an external-link icon) goes inside the link.
 */
export function linkPhrase(sentence, phrase, href, suffixHtml = "") {
  const s = String(sentence ?? "");
  const p = String(phrase ?? "");
  const a = `<a href="${escapeHtml(href)}">${escapeHtml(p)}${suffixHtml ? ` ${suffixHtml}` : ""}</a>`;
  const at = p ? s.indexOf(p) : -1;
  if (at < 0) return `${escapeHtml(s)} ${a}`;
  return escapeHtml(s.slice(0, at)) + a + escapeHtml(s.slice(at + p.length));
}
