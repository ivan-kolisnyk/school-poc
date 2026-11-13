import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default function () {
  const file = process.env.STRINGS_FILE
    ? path.resolve(process.cwd(), process.env.STRINGS_FILE)
    : path.join(root, "src/_settings/strings.en.json");
  return JSON.parse(readFileSync(file, "utf8"));
}
