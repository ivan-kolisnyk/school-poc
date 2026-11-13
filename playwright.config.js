import { defineConfig, devices } from "@playwright/test";

// A11Y_VARIANT=es-sample runs the Spanish-sample overflow check (DESIGN.md 14) against _site_es,
// built with STRINGS_FILE=tests/fixtures/strings-es-sample.json; see `npm run test:a11y:es`.
const ES = process.env.A11Y_VARIANT === "es-sample";
const PORT = ES ? 4174 : 4173;
const SITE_DIR = ES ? "_site_es" : "_site";

export default defineConfig({
  testDir: "tests/a11y",
  testMatch: ES ? "**/es-overflow.spec.js" : "**/site.spec.js",
  fullyParallel: true,
  outputDir: ES ? "test-results/es" : "test-results",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: ES ? "playwright-report-es" : "playwright-report" }],
    ["json", { outputFile: ES ? "test-results/a11y-es.json" : "test-results/a11y.json" }],
  ],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
  },
  projects: [{ name: ES ? "chromium-es-sample" : "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node tests/a11y/serve.js",
    url: `http://localhost:${PORT}/school-poc/`,
    env: { PORT: String(PORT), SITE_DIR },
    reuseExistingServer: !process.env.CI,
  },
});
