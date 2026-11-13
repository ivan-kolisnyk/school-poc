import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests/a11y",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/a11y.json" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node tests/a11y/serve.js",
    url: `http://localhost:${PORT}/school-poc/`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
  },
});
