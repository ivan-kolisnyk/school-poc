import { test } from "node:test";
import assert from "node:assert/strict";
import { isAlertActive } from "../../lib/alert.js";

const base = { show: true, level: "notice", message: "Hi", end: "2026-11-16T15:00" };
const at = (s) => new Date(s);

test("inactive when show is false, message empty, or end missing", () => {
  assert.equal(isAlertActive({ ...base, show: false }, at("2026-11-13T12:00:00Z")), false);
  assert.equal(isAlertActive({ ...base, message: "  " }, at("2026-11-13T12:00:00Z")), false);
  assert.equal(isAlertActive({ ...base, end: "" }, at("2026-11-13T12:00:00Z")), false);
  assert.equal(isAlertActive({ ...base, end: undefined }, at("2026-11-13T12:00:00Z")), false);
  assert.equal(isAlertActive(null, at("2026-11-13T12:00:00Z")), false);
});

test("active within start..end in Chicago time; start optional", () => {
  const a = { ...base, start: "2026-11-13T08:00" };
  assert.equal(isAlertActive(a, at("2026-11-13T13:59:00Z")), false); // 07:59 CST
  assert.equal(isAlertActive(a, at("2026-11-13T14:00:00Z")), true); // 08:00 CST
  assert.equal(isAlertActive(base, at("2026-01-01T00:00:00Z")), true);
});

test("end is exclusive and read as Chicago wall time", () => {
  assert.equal(isAlertActive(base, at("2026-11-16T20:59:00Z")), true);
  assert.equal(isAlertActive(base, at("2026-11-16T21:00:00Z")), false);
});
