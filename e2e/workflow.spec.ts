import { test, expect } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: /ต่อวงจรให้เห็นภาพ/ }),
  ).toBeVisible();
});

test("load half-adder, toggle inputs, verify and capture working application", async ({
  page,
}, info) => {
  await page.getByRole("button", { name: "Try the half-adder" }).click();
  await expect(page.getByTestId("output-sum")).toHaveText("0");
  await page.getByRole("button", { name: "Input A", exact: true }).click();
  await expect(page.getByTestId("output-sum")).toHaveText("1");
  await expect(page.getByTestId("output-carry")).toHaveText("0");
  await page.getByRole("button", { name: "Input B", exact: true }).click();
  await expect(page.getByTestId("output-sum")).toHaveText("0");
  await expect(page.getByTestId("output-carry")).toHaveText("1");
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toContainText(
    "4 ผ่าน · 0 ไม่ผ่าน",
  );
  await expect(page.locator(".truth-table .pass-badge")).toHaveText([
    "PASS",
    "PASS",
    "PASS",
    "PASS",
  ]);
  await expect(page.getByTestId("truth-row-11")).toHaveClass(/current-row/);
  await page.evaluate(() => document.fonts.ready);
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: `docs/screenshots/working-${info.project.name}.png`,
    fullPage: true,
  });
  if (info.project.name === "desktop") {
    await page
      .locator("#lab")
      .screenshot({ path: "docs/screenshots/working-circuit.png" });
    await page
      .locator("#verification")
      .screenshot({ path: "docs/screenshots/working-verification.png" });
  }
  await page.getByRole("button", { name: "Reset example" }).click();
  await expect(page.getByTestId("output-carry")).toHaveText("0");
  await expect(page.getByTestId("verification-summary")).toHaveCount(0);
});

test("broken example identifies exact mismatch and repair passes", async ({
  page,
}, info) => {
  await page.getByRole("button", { name: "Try a broken circuit" }).click();
  await page.getByRole("button", { name: "Input A", exact: true }).click();
  await page.getByRole("button", { name: "Input B", exact: true }).click();
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toContainText(
    "3 ผ่าน · 1 ไม่ผ่าน",
  );
  await expect(page.getByTestId("truth-row-11")).toContainText("FAIL");
  await expect(
    page.getByTestId("truth-row-11").locator(".mismatch"),
  ).toHaveText("1 mismatch");
  await page.evaluate(() => document.fonts.ready);
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: `docs/screenshots/error-${info.project.name}.png`,
    fullPage: true,
  });
  if (info.project.name === "desktop") {
    await page
      .locator("#lab")
      .screenshot({ path: "docs/screenshots/error-circuit.png" });
    await page
      .locator("#verification")
      .screenshot({ path: "docs/screenshots/error-verification.png" });
  }
  await page.getByRole("button", { name: /ซ่อม Sum/ }).click();
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toContainText(
    "4 ผ่าน · 0 ไม่ผ่าน",
  );
});

test("full-adder verifies eight cases and live carry-in works", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Full-adder", exact: true }).click();
  await page
    .getByRole("button", { name: "Input Carry-in", exact: true })
    .click();
  await expect(page.getByTestId("output-sum")).toHaveText("1");
  await expect(page.getByTestId("output-cout")).toHaveText("0");
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toContainText(
    "8 ผ่าน · 0 ไม่ผ่าน",
  );
});

test("export JSON, change state, then import restores circuit and expected table", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Input A", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save JSON" }).click();
  const download = await downloadEvent;
  const content = await readFile((await download.path())!);
  await page.getByRole("button", { name: "Full-adder", exact: true }).click();
  await page.getByLabel("Load circuit JSON").setInputFiles({
    name: "saved.json",
    mimeType: "application/json",
    buffer: content,
  });
  await expect(page.getByTestId("output-sum")).toHaveText("1");
  await expect(
    page.getByRole("button", { name: "Input Carry-in", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toContainText(
    "4 ผ่าน · 0 ไม่ผ่าน",
  );
});

test("malformed import shows an error and leaves circuit intact", async ({
  page,
}) => {
  await page.getByLabel("Load circuit JSON").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{invalid"),
  });
  await expect(page.getByRole("alert")).toContainText("อ่าน JSON ไม่ได้");
  await page.getByRole("button", { name: "Input A", exact: true }).click();
  await expect(page.getByTestId("output-sum")).toHaveText("1");
});

test("expected editor uses independent editable answers", async ({ page }) => {
  await page.getByRole("button", { name: "กำหนด Expected" }).click();
  await page
    .getByLabel("Expected Sum for 00", { exact: true })
    .selectOption("1");
  await page.getByRole("button", { name: "บันทึกคำตอบอ้างอิง" }).click();
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toContainText(
    "3 ผ่าน · 1 ไม่ผ่าน",
  );
  await expect(page.getByTestId("truth-row-00")).toContainText("FAIL");
});

test("missing inputs stay unknown and prevent a passing verification", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Add NOT", exact: true }).click();
  await expect(page.locator(".validation-errors")).toContainText(
    "MISSING_INPUT",
  );
  await expect(page.getByTestId("output-sum")).toHaveText("?");
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toHaveCount(0);
  await page.getByRole("button", { name: "ลบที่เลือก" }).click();
  await expect(page.locator(".validation-errors")).toHaveCount(0);
  await expect(page.getByTestId("output-sum")).toHaveText("0");
});

test("base-path assets load, no external runtime assets, and refresh works", async ({
  page,
}) => {
  const failures: string[] = [];
  const external: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  page.on("request", (r) => {
    if (new URL(r.url()).origin !== new URL(page.url()).origin)
      external.push(r.url());
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.getByRole("button", { name: "Input A", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toContainText(
    "4 ผ่าน · 0 ไม่ผ่าน",
  );
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("desktop manual gate repair and node movement", async ({ page }, info) => {
  test.skip(
    info.project.name === "mobile",
    "Phone editing is secondary; mobile workflow tested separately.",
  );
  await page.getByRole("button", { name: "Try a broken circuit" }).click();
  const node = page.getByTestId("node-xor");
  await node.click();
  await page.getByLabel("Gate type", { exact: true }).selectOption("XOR");
  const box = await node.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 50, box!.y + 16);
  await page.mouse.down();
  await page.mouse.move(box!.x + 70, box!.y + 35, { steps: 8 });
  await page.mouse.up();
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toContainText(
    "4 ผ่าน · 0 ไม่ผ่าน",
  );
});

test("desktop can delete and reconnect a wire, then rejects multiple drivers", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "Desktop port drag; mobile examples and verification remain usable.",
  );
  const wire = page.locator('.react-flow__edge[data-id="w5"]');
  await wire.click();
  await page.getByRole("button", { name: "ลบที่เลือก" }).click();
  await expect(page.locator(".validation-errors")).toContainText(
    "MISSING_INPUT",
  );
  const source = page
    .getByTestId("node-xor")
    .locator(".react-flow__handle.source");
  const target = page
    .getByTestId("node-sum")
    .locator(".react-flow__handle.target");
  await source.dragTo(target);
  await expect(page.locator(".validation-errors")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Check all inputs", exact: true })
    .click();
  await expect(page.getByTestId("verification-summary")).toContainText(
    "4 ผ่าน · 0 ไม่ผ่าน",
  );
  await page
    .getByTestId("node-a")
    .locator(".react-flow__handle.source")
    .dragTo(target);
  await expect(page.getByRole("alert")).toContainText(
    "มีสายขับมากกว่าหนึ่งเส้น",
  );
});
