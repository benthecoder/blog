import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/views**", (route) =>
    route.fulfill({ json: { count: 0 } })
  );
});

for (const width of [320, 390, 640, 1440]) {
  test(`reading stays within the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/posts/ask");
    // Wait for a post's client component to hydrate before stress-testing
    // its DOM, otherwise React correctly replaces our injected content.
    await expect(page.getByText("0 views", { exact: true })).toBeVisible();
    await page.evaluate(() => {
      document.querySelector("h1")!.textContent = "AnUnbrokenTitle".repeat(15);
      const article = document.querySelector("article.prose")!;
      const paragraph = document.createElement("p");
      paragraph.textContent = "https://example.com/" + "long-path".repeat(50);
      const pre = document.createElement("pre");
      pre.textContent = "const longIdentifier = '" + "x".repeat(300) + "';";
      article.append(paragraph, pre);
    });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        )
      )
      .toBeLessThanOrEqual(1);
    const code = page.locator("article.prose pre").last();
    expect(
      await code.evaluate(
        (element) => element.scrollWidth > element.clientWidth
      )
    ).toBe(true);
  });
}

test("reading reflows at the equivalent of 200% browser zoom", async ({
  page,
}) => {
  // A 1280px viewport at 200% has 640 CSS pixels; a device scale factor
  // changes raster density, not layout, so it cannot test zoom reflow.
  await page.setViewportSize({ width: 640, height: 450 });
  await page.goto("/posts/ask");
  await expect(page.getByText("0 views", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
    )
    .toBeLessThanOrEqual(1);
  const measure = await page.locator("article.prose").evaluate((element) => {
    const ruler = document.createElement("span");
    ruler.style.font = getComputedStyle(element).font;
    ruler.textContent = "0";
    element.append(ruler);
    const ch = ruler.getBoundingClientRect().width;
    ruler.remove();
    return element.getBoundingClientRect().width / ch;
  });
  expect(measure).toBeLessThanOrEqual(75);
});

test("article images open by keyboard and return focus after Escape", async ({
  page,
}) => {
  await page.goto("/posts/150225");
  await expect(page.getByText("0 views", { exact: true })).toBeVisible();
  const trigger = page.getByRole("button", {
    name: "Expand image: Golden Dragon",
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Golden Dragon",
    exact: true,
  });
  await expect(
    dialog.getByRole("button", { name: "Close expanded image" })
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
