import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { formatDate, formatTime, chicagoLocalToDate } from "../../lib/dates.js";

test("formatDate styles", () => {
  assert.equal(formatDate("2026-11-16", "list"), "Monday, Nov 16");
  assert.equal(formatDate("2026-11-16", "post"), "November 16, 2026");
  assert.equal(formatDate("2026-11-12", "card"), "Nov 12");
  assert.equal(formatDate("2026-11-16", "month"), "Nov");
  assert.equal(formatDate("2026-11-16", "day"), "16");
});

test("formatDate accepts Date objects (Chicago wall time)", () => {
  assert.equal(formatDate(new Date("2026-11-16T03:00:00Z"), "card"), "Nov 15");
});

test("date-only strings do not shift under other time zones", () => {
  for (const tz of ["UTC", "Pacific/Honolulu"]) {
    const out = execFileSync(
      process.execPath,
      ["--input-type=module", "-e",
        `import { formatDate } from ${JSON.stringify(new URL("../../lib/dates.js", import.meta.url).href)};
         process.stdout.write(formatDate("2026-11-16","list"));`],
      { env: { ...process.env, TZ: tz }, encoding: "utf8" }
    );
    assert.equal(out, "Monday, Nov 16", tz);
  }
});

test("formatTime uses Chicago", () => {
  assert.equal(formatTime(new Date("2026-11-16T14:00:00Z")), "8:00 am");
  assert.equal(formatTime(new Date("2026-11-16T21:30:00Z")), "3:30 pm");
});

test("chicagoLocalToDate handles CST and CDT", () => {
  assert.equal(chicagoLocalToDate("2026-11-16T15:00").toISOString(), "2026-11-16T21:00:00.000Z");
  assert.equal(chicagoLocalToDate("2026-07-01T15:00").toISOString(), "2026-07-01T20:00:00.000Z");
  assert.equal(chicagoLocalToDate("2026-11-16").toISOString(), "2026-11-16T06:00:00.000Z");
});
