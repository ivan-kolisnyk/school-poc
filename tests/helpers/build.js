import { spawn } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cache = new Map();
const outDirs = new Map();
const logs = new Map();

const baseEnv = {
  SITE_NOW: "2026-11-13T12:00:00-06:00",
  CALENDAR_ICS_FILE: "tests/fixtures/calendar.ics",
  ALERT_FILE: "tests/fixtures/alert-on.json",
};

/**
 * Build the site once per variant name: `{ name, env, root }`. `root` builds another checkout
 * (the CMS-edit regression test builds an edited copy of the repo).
 * Every test build reads its events from a file: CALENDAR_ICS_FILE must be set (it defaults to
 * the fixture calendar), so a feed address an admin pastes into site.json is never fetched by tests.
 */
export function build(variant = { name: "default", env: {} }) {
  const name = variant.name || "default";
  if (!cache.has(name)) {
    const env = { ...process.env, ...baseEnv, ...(variant.env || {}) };
    if (!String(env.CALENDAR_ICS_FILE ?? "").trim()) {
      throw new Error(`build "${name}": CALENDAR_ICS_FILE must name a calendar file; tests never fetch the live feed.`);
    }
    const siteRoot = variant.root ? path.resolve(variant.root) : root;
    // One folder per test process: node --test runs test files in parallel, and two files
    // building into the same folder would delete each other's output mid-run.
    const out = path.join(siteRoot, "_test_site", `${name}-${process.pid}`);
    outDirs.set(name, out);
    process.once("exit", () => rmSync(out, { recursive: true, force: true }));
    cache.set(
      name,
      (async () => {
        await rm(out, { recursive: true, force: true });
        const bin = path.join(siteRoot, "node_modules/@11ty/eleventy/cmd.cjs");
        await new Promise((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [bin, `--output=${out}`, "--pathprefix=/school-poc/", "--quiet"],
            { cwd: siteRoot, env, stdio: ["ignore", "pipe", "pipe"] }
          );
          let err = "";
          child.stdout.on("data", (d) => (err += d));
          child.stderr.on("data", (d) => (err += d));
          child.on("error", reject);
          child.on("close", (code) => {
            logs.set(name, err);
            code === 0 ? resolve() : reject(new Error(`eleventy exited ${code}\n${err}`));
          });
        });
        // Index the prefixed output so /school-poc/pagefind/ resolves like it does in production.
        await new Promise((resolve, reject) => {
          const pf = spawn(process.execPath, [path.join(siteRoot, "node_modules/pagefind/lib/runner/bin.cjs"), "--site", out], {
            cwd: siteRoot,
            stdio: ["ignore", "pipe", "pipe"],
          });
          let perr = "";
          pf.stdout.on("data", (d) => (perr += d));
          pf.stderr.on("data", (d) => (perr += d));
          pf.on("error", reject);
          pf.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`pagefind exited ${code}\n${perr}`))));
        });
        return out;
      })()
    );
  }
  return cache.get(name);
}

export function page(p, variantName = "default") {
  const out = outDirs.get(variantName);
  if (!out) throw new Error(`variant "${variantName}" has not been built; await build() first`);
  return parse(readFileSync(path.join(out, p), "utf8"));
}

/** Everything the build printed (stdout and stderr), e.g. content warnings. */
export function buildLog(variantName = "default") {
  if (!logs.has(variantName)) throw new Error(`variant "${variantName}" has not been built; await build() first`);
  return logs.get(variantName);
}
