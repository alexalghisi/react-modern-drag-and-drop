import { expect, test, type Locator, type Page } from "@playwright/test";

/** Visible order of rows in the first pane, as `row-<type>-<id>` test ids. */
async function rowOrder(page: Page): Promise<string[]> {
  const ids = await page
    .locator("[data-row]")
    .evaluateAll((rows) => rows.map((row) => row.getAttribute("data-testid") ?? ""));
  return ids;
}

/**
 * dnd-kit only starts a drag after the pointer has travelled its 8px activation
 * distance, and it recomputes the drop target from pointer *movement*. The
 * target is measured after activation because the sortable list shifts its rows
 * as soon as the drag begins, which invalidates any earlier measurement.
 */
async function dragOnto(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();

  const from = await source.boundingBox();
  const initialTarget = await target.boundingBox();
  if (from === null || initialTarget === null) {
    throw new Error("Cannot drag: element has no bounding box");
  }

  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  // Nudge towards the target rather than always downwards, so the activation
  // move can never leave the viewport.
  const direction = initialTarget.y >= from.y ? 1 : -1;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + direction * 12, { steps: 5 });

  // Re-measure: the sortable list shifts its rows once the drag is active.
  const to = await target.boundingBox();
  if (to === null) throw new Error("Cannot drag: target has no bounding box");

  const endX = to.x + to.width / 2;
  const endY = to.y + to.height / 2;

  await page.mouse.move(endX, endY, { steps: 25 });
  // One extra move so the final collision is registered at rest.
  await page.mouse.move(endX, endY + 1, { steps: 2 });
  await page.waitForTimeout(100);
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
  // The web fonts load asynchronously and change row heights when they swap in.
  // Dragging before that settles measures coordinates that go stale mid-gesture.
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByTestId("row-file-7")).toBeVisible();
});

test("reorders siblings with the pointer", async ({ page }) => {
  const before = await rowOrder(page);
  expect(before).toContain("row-file-7");

  await dragOnto(page, page.getByTestId("row-file-7"), page.getByTestId("row-file-13"));

  const after = await rowOrder(page);
  expect(after.indexOf("row-file-7")).toBeGreaterThan(before.indexOf("row-file-7"));
  expect(after).toHaveLength(before.length);
});

test("reorders siblings with the keyboard alone", async ({ page }) => {
  const overlay = page.getByTestId("drag-overlay");

  await page.getByTestId("row-file-7").focus();

  await page.keyboard.press("Space");
  await expect(overlay).toContainText("README.md");

  await page.keyboard.press("ArrowDown");
  // dnd-kit remeasures on the next animation frame, so the drop has to wait for
  // the move to be applied rather than following immediately.
  await expect(page.getByTestId("row-file-13")).toHaveAttribute("data-reorder-target", "true");

  await page.keyboard.press("Space");
  await expect(overlay).toHaveCount(0);

  expect(await rowOrder(page)).toEqual([
    "row-folder-1",
    "row-folder-2",
    "row-folder-10",
    "row-file-13",
    "row-file-7",
    "row-file-16",
  ]);
});

test("moves a file into a folder by dropping it on the row", async ({ page }) => {
  await dragOnto(page, page.getByTestId("row-file-13"), page.getByTestId("row-folder-1"));

  await expect(page.getByTestId("row-file-13")).toHaveCount(0);

  await page.getByTestId("row-folder-1").dblclick();
  await expect(page.getByTestId("row-file-13")).toBeVisible();
});

test("moves a file back to the root by dropping it on a breadcrumb", async ({ page }) => {
  await page.getByTestId("row-folder-1").dblclick();
  await expect(page.getByTestId("row-file-4")).toBeVisible();

  await dragOnto(page, page.getByTestId("row-file-4"), page.getByRole("button", { name: "Home" }));

  await expect(page.getByTestId("row-file-4")).toHaveCount(0);

  await page.getByRole("button", { name: "Home" }).click();
  await expect(page.getByTestId("row-file-4")).toBeVisible();
});

test("never offers a folder's own subtree as a move destination", async ({ page }) => {
  await page
    .getByTestId("row-folder-1")
    .getByRole("button", { name: "Actions for Documents" })
    .click();
  await page.getByRole("menuitem", { name: /Move to/ }).click();
  await page.getByTestId("select-move-destination").click();

  await expect(page.getByRole("option", { name: /Home \(Root\)/ })).toBeVisible();
  await expect(page.getByRole("option", { name: "Images" })).toBeVisible();
  // "Work" is nested inside "Documents", so moving Documents there is illegal
  // and the option must not exist at all.
  await expect(page.getByRole("option", { name: "Work" })).toHaveCount(0);
});

test("drags a multi-row selection in one gesture", async ({ page }) => {
  await page.getByTestId("row-file-13").click();
  await page.getByTestId("row-file-16").click({ modifiers: ["Meta"] });

  await dragOnto(page, page.getByTestId("row-file-13"), page.getByTestId("row-folder-2"));

  await expect(page.getByTestId("row-file-13")).toHaveCount(0);
  await expect(page.getByTestId("row-file-16")).toHaveCount(0);

  await page.getByTestId("row-folder-2").dblclick();
  await expect(page.getByTestId("row-file-13")).toBeVisible();
  await expect(page.getByTestId("row-file-16")).toBeVisible();
});

test("keeps a required file in its folder", async ({ page }) => {
  await dragOnto(page, page.getByTestId("row-file-7"), page.getByTestId("row-folder-1"));

  await expect(page.getByTestId("row-file-7")).toBeVisible();
  await expect(page.getByTestId("row-file-7")).toHaveAttribute("data-mandatory", "true");
});
