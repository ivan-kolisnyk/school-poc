import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default function () {
  const file = process.env.ALERT_FILE
    ? path.resolve(process.cwd(), process.env.ALERT_FILE)
    : path.join(root, "src/_settings/alert.json");
  return JSON.parse(readFileSync(file, "utf8"));
}
