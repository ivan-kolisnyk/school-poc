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

/** Labeled striped box standing in for a photo (DESIGN.md section 9), or a map with kind "Map". */
export function placeholder(label, ratio, kind = "Photo") {
  const l = escapeHtml(label);
  return `<div class="ph" style="aspect-ratio:${escapeHtml(ratio)}" role="img" aria-label="${escapeHtml(kind)} placeholder: ${l}"><span>${l}</span></div>`;
}

/**
 * "cps" for a link to a CPS site (any *.cps.edu host), "other" for any other web address,
 * "" for internal, mail and phone links. External links show the "opens … site" icon (DESIGN.md 10.2).
 */
export function externalKind(href) {
  const m = /^https?:\/\/([^/?#:]+)/i.exec(String(href ?? ""));
  if (!m) return "";
  const host = m[1].toLowerCase();
  return host === "cps.edu" || host.endsWith(".cps.edu") ? "cps" : "other";
}

/** The labelled external-link icon for `href`, or "" when the link is internal. */
export function externalIcon(labels, href) {
  const kind = externalKind(href);
  return kind ? icon("external-link", labels[kind]) : "";
}

/**
 * Link to a file that states its type and size (DESIGN.md 10.10, A13):
 * "LSC minutes, Oct 2026 (PDF, 220 KB)". `labels` = { cps, other } names for the external icon.
 */
export function docLink(labels, label, url, type, size) {
  const meta = [type, size].filter(Boolean).map(escapeHtml).join(", ");
  const ext = externalIcon(labels, url);
  return `<a class="doc-link" href="${escapeHtml(url)}">${icon("file-text")}` +
    `<span class="doc-link__label">${escapeHtml(label)}${meta ? ` <span class="doc-link__meta">(${meta})</span>` : ""}</span>` +
    `${ext ? ` ${ext}` : ""}</a>`;
}

/**
 * Callout box (surface background, gold left bar) around already-rendered HTML. One HTML block
 * with no blank lines, so Markdown keeps it whole.
 */
export function callout(html, title) {
  const body = String(html ?? "").trim().replace(/\n\s*\n/g, "\n");
  const head = title ? `<p class="callout__title">${escapeHtml(title)}</p>` : "";
  return `<div class="callout">${head}${body}</div>`;
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
