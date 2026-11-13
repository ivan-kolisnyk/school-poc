// Content checks on the real site: plain-language and migration rules for what editors write.
// NOT deploy-gating (final review C1): `npm run test:content` runs in the CI a11y job, which
// reports problems for an admin and never blocks publishing. Template behaviour is tested with
// fixtures in tests/build; these only ask "does today's content still follow the house rules?".
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { build, page } from "../helpers/build.js";
import { contentPageFiles, siteData, staffPeople } from "../helpers/content.js";

const out = await build();
const site = siteData();
const text = (el) => (el ? el.text.replace(/\s+/g, " ").trim() : "");
const has = (file) => existsSync(path.join(out, file));

function allHtml(dir = out, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) allHtml(p, acc);
    else if (entry.name.endsWith(".html")) acc.push(path.relative(out, p));
  }
  return acc;
}

test("no page carries stale school-year text", () => {
  for (const file of allHtml()) {
    assert.doesNotMatch(text(page(file).querySelector("main")), /24-25|2024-2025/, file);
  }
});

test("key pages have real content", () => {
  for (const p of ["about/tours/index.html", "enroll/index.html", "families/preschool/index.html", "contact/index.html"]) {
    if (!has(p)) continue;
    assert.ok(text(page(p).querySelector("main .page-body")).length > 200, `${p} is nearly empty`);
  }
});

// Plain language (DESIGN.md 14): jargon spelled out where a page first uses it.
const JARGON = [
  ["LSC", /Local School Council \(LSC\)/],
  ["PAC", /Parent Advisory Council \(PAC\)/],
  ["CPC", /Child-Parent Center \(CPC\)/],
  ["ISBE", /Illinois State Board of Education \(ISBE\)/],
  ["SCORE", /SCORE, the after-school sports program of Chicago Public Schools/],
  ["GoCPS", /GoCPS, the CPS application and lottery website/],
];

test("jargon is spelled out at its first use on each content page", () => {
  for (const file of contentPageFiles()) {
    const main = page(file).querySelector("main");
    const t = `${text(main.querySelector(".page-header__intro"))} ${text(main.querySelector(".page-body"))}`;
    for (const [abbr, expansion] of JARGON) {
      const first = t.search(new RegExp(`\\b${abbr}\\b`));
      if (first < 0) continue;
      const near = t.slice(Math.max(0, first - 60), first + 160);
      assert.match(near, expansion, `${file}: first "${abbr}" is explained`);
    }
  }
});

test("staff job titles spell out abbreviations", () => {
  for (const { file, data } of staffPeople()) {
    assert.doesNotMatch(String(data.role ?? ""), /\bSECA\b|\bELPT\b|CPC Lead/, file);
  }
});

test("the PAC page promises nothing the school has not confirmed", (t) => {
  if (!has("about/lsc-pac/index.html")) return t.skip("no LSC & PAC page");
  const body = text(page("about/lsc-pac/index.html").querySelector("main .page-body"));
  assert.doesNotMatch(body, /calendar/i);
  assert.doesNotMatch(body, /2023|2024/);
});

test("the tours page ends with a Request a tour button to the tour form", (t) => {
  if (!has("about/tours/index.html")) return t.skip("no tours page");
  const last = page("about/tours/index.html").querySelector("main .page-body").querySelectorAll("a").at(-1);
  assert.ok(last.classList.contains("btn--primary"));
  assert.equal(last.getAttribute("href"), site.links.tourForm);
});

test("the contact page gives the address, phone, fax, email and hours", () => {
  const t = text(page("contact/index.html").querySelector("main .page-body"));
  for (const fact of [site.address, site.phone, site.fax, site.hours, site.email]) assert.ok(t.includes(fact), fact);
});
