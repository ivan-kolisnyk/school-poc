// Editor-written content made safe for the page (final review C1, I1, Minor 5).

/**
 * Rich-text bodies sit under a heading the template owns (the page h1, or the homepage welcome
 * h2). Editors can pick any heading level, so re-level the body's headings: none above
 * `parentLevel + 1`, and never more than one level deeper than the heading before it.
 * A pasted Heading 1 becomes an h2; a Heading 4 straight after an h2 becomes an h3.
 */
export function normalizeHeadings(html, parentLevel = 1) {
  const top = Math.min(6, parentLevel + 1);
  let prev = parentLevel;
  return String(html ?? "").replace(/<h([1-6])(\s[^>]*)?>([\s\S]*?)<\/h\1\s*>/gi, (m, level, attrs = "", inner) => {
    const next = Math.min(6, Math.max(top, Math.min(Number(level), prev + 1)));
    prev = next;
    return `<h${next}${attrs}>${inner}</h${next}>`;
  });
}

const SAFE_HREF = /^(https?:\/\/|\/(?!\/)|mailto:|tel:)/i;

/**
 * A link typed into a CMS field: a full web address, a site path starting with one "/",
 * mailto: or tel:. Anything else ("javascript:", "//host", "news/") returns "" so the
 * template leaves the link out.
 */
export function safeHref(href) {
  const value = String(href ?? "").trim();
  return SAFE_HREF.test(value) ? value : "";
}

const MD_IMAGE = /!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
const HTML_IMAGE = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi;

/** Images in a Markdown or HTML body: [{ match, src }] (Markdown images first). */
export function imageRefs(body) {
  const text = String(body ?? "");
  return [
    ...[...text.matchAll(MD_IMAGE)].map((m) => ({ match: m[0], src: m[1] ?? m[2] })),
    ...[...text.matchAll(HTML_IMAGE)].map((m) => ({ match: m[0], src: m[1] ?? m[2] })),
  ];
}
