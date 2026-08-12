// Regenerates docs/screenshot.png. Requires the dev server on :5173.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto("http://localhost:5173/");
await page.getByTestId("row-file-7").waitFor();
await page.evaluate(() => document.fonts.ready);

// Second pane, opened inside "Documents", to show independent navigation.
await page.getByTestId("button-add-pane").click();
const panes = page.locator("[data-panel]");
await panes.nth(1).getByTestId("row-folder-1").dblclick();

// Two rows selected in the left pane: a multi-row drag travels together.
await panes.nth(0).getByTestId("row-file-7").click();
await panes
  .nth(0)
  .getByTestId("row-file-13")
  .click({ modifiers: ["Meta"] });

await mkdir("docs", { recursive: true });
await page.screenshot({ path: "docs/screenshot.png" });

await browser.close();
console.log("Wrote docs/screenshot.png");
