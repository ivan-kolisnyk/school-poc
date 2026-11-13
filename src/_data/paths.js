// Internal page paths, each defined once. Templates link through `paths.<key>` instead of
// writing URLs out, so a moved page changes in one place. The five top-level section URLs
// come from nav.json (the header's source); the rest are pages inside those sections.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export default function () {
  const nav = JSON.parse(readFileSync(path.join(here, "nav.json"), "utf8"));
  const sections = Object.fromEntries(nav.map((item) => [item.key, item.url]));
  return {
    ...sections, // about, families, enroll, news, contact
    events: "/events/",
    tours: "/about/tours/",
    beforeAfterCare: "/families/before-after-care/",
  };
}
