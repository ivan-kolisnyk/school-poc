import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cache = new Map();
const outDirs = new Map();

const baseEnv = {
  SITE_NOW: "2026-11-13T12:00:00-06:00",
  CALENDAR_ICS_FILE: "tests/fixtures/calendar.ics",
};

export function build(variant = { name: "default", env: {} }) {
  const name = variant.name || "default";
  if (!cache.has(name)) {
    const out = path.join(root, "_test_site", name);
    outDirs.set(name, out);
    cache.set(
      name,
      (async () => {
        await rm(out, { recursive: true, force: true });
        const bin = path.join(root, "node_modules/@11ty/eleventy/cmd.cjs");
        await new Promise((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [bin, `--output=${out}`, "--pathprefix=/school-poc/", "--quiet"],
            { cwd: root, env: { ...process.env, ...baseEnv, ...(variant.env || {}) }, stdio: ["ignore", "pipe", "pipe"] }
          );
          let err = "";
          child.stdout.on("data", (d) => (err += d));
          child.stderr.on("data", (d) => (err += d));
          child.on("error", reject);
          child.on("close", (code) =>
            code === 0 ? resolve() : reject(new Error(`eleventy exited ${code}\n${err}`))
          );
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
