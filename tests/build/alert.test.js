import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, page } from "../helpers/build.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strings = JSON.parse(readFileSync(path.join(root, "src/_settings/strings.en.json"), "utf8"));
const text = (el) => el.text.replace(/\s+/g, " ").trim();

await build();
await build({ name: "no-alert", env: { ALERT_FILE: "tests/fixtures/alert-off.json" } });
await build({
  name: "emergency",
  env: { ALERT_FILE: "tests/fixtures/alert-emergency.json" },
});

test("active closed alert renders above the header with label, expiry and status role", () => {
  const root = page("index.html");
  const alerts = root.querySelectorAll(".alert");
  assert.equal(alerts.length, 1);
  const el = alerts[0];
  assert.equal(el.getAttribute("role"), "status");
  assert.equal(el.getAttribute("data-alert-end"), "2026-11-16T21:00:00.000Z");
  assert.equal(text(el.querySelector(".alert__label")), strings.alertLabels.closed);
  assert.match(text(el), /No school Monday/);
  const link = el.querySelector("a");
  assert.equal(text(link), strings.alert.details);
  assert.ok(el.querySelector("button[data-alert-dismiss]"));
  const html = root.querySelector("body").innerHTML;
  assert.ok(html.indexOf('class="alert') < html.indexOf("<header"));
  assert.ok(html.indexOf("skip-link") < html.indexOf('class="alert'));
});

test("show:false renders no alert element", () => {
  assert.equal(page("index.html", "no-alert").querySelectorAll(".alert").length, 0);
});

test("emergency uses role=alert and has no dismiss button", () => {
  const el = page("index.html", "emergency").querySelector(".alert");
  assert.equal(el.getAttribute("role"), "alert");
  assert.equal(text(el.querySelector(".alert__label")), strings.alertLabels.emergency);
  assert.equal(el.querySelector("[data-alert-dismiss]"), null);
});

test("Details link carries the path prefix", () => {
  const link = page("index.html").querySelector(".alert a");
  assert.equal(link.getAttribute("href"), "/school-poc/news/");
});
