// Records docs/demo.gif from a live drag-and-drop session.
// Requires the dev server on :5173 (`npm run dev`).
import { chromium } from "@playwright/test";
import gifenc from "gifenc";
import { mkdir, writeFile } from "node:fs/promises";
import pngjs from "pngjs";

const { GIFEncoder, applyPalette, quantize } = gifenc;
const { PNG } = pngjs;

const DELAY_MS = 90;

async function screenshotWindow(page) {
  return page.getByTestId("finder-window").screenshot({ type: "png" });
}

async function hold(page, frames, count) {
  const shot = await screenshotWindow(page);
  for (let i = 0; i < count; i += 1) frames.push(shot);
}

async function dragOnto(page, frames, source, target) {
  await source.scrollIntoViewIfNeeded();

  const from = await source.boundingBox();
  const initialTarget = await target.boundingBox();
  if (from === null || initialTarget === null) {
    throw new Error("Cannot drag: element has no bounding box");
  }

  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const direction = initialTarget.y >= from.y ? 1 : -1;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + direction * 12, { steps: 4 });
  frames.push(await screenshotWindow(page));

  const to = await target.boundingBox();
  if (to === null) throw new Error("Cannot drag: target has no bounding box");

  const endX = to.x + to.width / 2;
  const endY = to.y + to.height / 2;
  const steps = 22;

  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    await page.mouse.move(startX + (endX - startX) * t, startY + (endY - startY) * t);
    if (i % 2 === 0) frames.push(await screenshotWindow(page));
  }

  await page.mouse.move(endX, endY + 1);
  frames.push(await screenshotWindow(page));
  await page.waitForTimeout(80);
  await page.mouse.up();
  frames.push(await screenshotWindow(page));
}

function encodeGif(pngBuffers) {
  const gif = GIFEncoder();

  for (const [index, buffer] of pngBuffers.entries()) {
    const png = PNG.sync.read(buffer);
    const rgba = new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.byteLength);
    const palette = quantize(rgba, 128);
    const indexed = applyPalette(rgba, palette);
    gif.writeFrame(indexed, png.width, png.height, {
      palette,
      delay: index === 0 ? 800 : DELAY_MS,
      repeat: 0,
    });
  }

  gif.finish();
  return gif.bytes();
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 860 },
  deviceScaleFactor: 1,
});

await page.goto("http://localhost:5173/");
await page.getByTestId("row-file-7").waitFor();
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);

const frames = [];

await hold(page, frames, 4);

await page.getByTestId("button-add-pane").click();
await hold(page, frames, 3);

const panes = page.locator("[data-panel]");
await panes.nth(1).getByTestId("row-folder-1").dblclick();
await hold(page, frames, 4);

await dragOnto(
  page,
  frames,
  panes.nth(0).getByTestId("row-file-13"),
  panes.nth(0).getByTestId("row-folder-1"),
);
await hold(page, frames, 5);

await dragOnto(
  page,
  frames,
  panes.nth(0).getByTestId("row-file-7"),
  panes.nth(0).getByTestId("row-folder-1"),
);
await hold(page, frames, 4);

await dragOnto(
  page,
  frames,
  panes.nth(0).getByTestId("row-file-16"),
  panes.nth(1).getByTestId("row-folder-3"),
);
await hold(page, frames, 6);

await mkdir("docs", { recursive: true });
const gif = encodeGif(frames);
await writeFile("docs/demo.gif", gif);

await page.screenshot({ path: "docs/screenshot.png" });

await browser.close();
console.log(
  `Wrote docs/demo.gif (${String(frames.length)} frames, ${String(gif.byteLength)} bytes)`,
);
console.log("Wrote docs/screenshot.png");
