import { defineConfig, devices } from "@playwright/test";

const PORT = 5173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // Tall enough that every seeded row fits without scrolling: raw mouse
      // coordinates are not auto-scrolled into view the way clicks are.
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 1024 } },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${String(PORT)}`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
