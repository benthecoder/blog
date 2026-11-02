import { expect, test } from "@playwright/test";

const documents = [
  {
    post_slug: "ask",
    post_title: "Ask For What You Want",
    content: "Ask for resources, feedback, and lessons.",
    tags: ["communication"],
    published_date: "2024-01-10",
  },
  {
    post_slug: "codemate",
    post_title: "Codemate",
    content: "Ask thoughtful questions about code.",
    tags: ["programming"],
    published_date: "2024-01-01",
  },
];

test("search supports arrow keys, Escape, focus return and a fresh reopen", async ({
  page,
  browserName,
}) => {
  await page.route("**/search-index.json", (route) =>
    route.fulfill({ json: documents })
  );
  await page.goto("/design");
  const trigger = page
    .getByRole("button", { name: "quiet", exact: true })
    .first();
  await trigger.focus();
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "Search posts" });
  const input = dialog.getByRole("combobox");
  await expect(input).toBeFocused();
  await input.fill("ask");
  const options = dialog.getByRole("option");
  await expect(options).toHaveCount(2);
  await page.keyboard.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(input).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  // macOS WebKit's default Tab skips buttons; Option-Tab includes them.
  await page.keyboard.press(
    browserName === "webkit" && process.platform === "darwin"
      ? "Alt+Tab"
      : "Tab"
  );
  const close = dialog.getByRole("button", { name: "Close search" });
  await expect(close).toBeFocused();
  await expect(close).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(trigger).toBeFocused();
});

test("search announces loading, recovers from failure and explains empty results", async ({
  page,
}) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route("**/search-index.json", async (route) => {
    if (++requests === 1) {
      await pending;
      await route.fulfill({ status: 503, body: "Unavailable" });
    } else await route.fulfill({ json: documents });
  });
  await page.goto("/design");
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "Search posts" });
  const input = dialog.getByRole("combobox");
  await input.fill("ask");
  await expect(dialog.getByRole("status")).toHaveText("loading search…");
  release();
  await expect(dialog.getByRole("alert")).toContainText("Search unavailable");
  await dialog.getByRole("button", { name: "try again" }).click();
  await expect(dialog.getByRole("option")).toHaveCount(2);
  await input.fill("no-such-article-xyz".repeat(20));
  await expect(dialog.getByRole("status")).toHaveText("0 results");
  await expect(
    dialog.getByText("no posts found", { exact: false })
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
    )
    .toBeLessThanOrEqual(1);
  await dialog.getByRole("button", { name: "Clear search" }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
});

test("photo viewer supports keyboard stepping, focus containment and browser Back", async ({
  page,
}) => {
  await page.goto("/design");
  const trigger = page.getByRole("button", { name: "Open photo:" }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Photo viewer" });
  const close = dialog.getByRole("button", { name: "Close photo" });
  await expect(close).toBeFocused();
  await expect(
    dialog.getByRole("button", { name: "Previous photo" })
  ).toBeDisabled();
  await page.keyboard.press("Shift+Tab");
  // Native dialogs may send reverse-Tab to browser chrome (body), but
  // must never send focus to an inert background control.
  expect(
    await dialog.evaluate(
      (element) =>
        element.contains(document.activeElement) ||
        document.activeElement === document.body
    )
  ).toBe(true);
  await trigger.focus();
  await expect(trigger).not.toBeFocused();
  await close.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    dialog.getByRole("button", { name: "Next photo" })
  ).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(
    dialog.getByRole("button", { name: "Previous photo" })
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/\/design$/);
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("photo swipe has equivalent button controls", async ({ page }) => {
  await page.goto("/design");
  await page.getByRole("button", { name: "Open photo:" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Photo viewer" });
  const image = dialog.locator(".ph-lightbox-image");
  await image.dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    clientX: 250,
    clientY: 200,
  });
  await image.dispatchEvent("pointerup", {
    pointerId: 1,
    pointerType: "touch",
    clientX: 60,
    clientY: 200,
  });
  await expect(
    dialog.getByRole("button", { name: "Next photo" })
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Previous photo" }).click();
  await expect(
    dialog.getByRole("button", { name: "Previous photo" })
  ).toBeDisabled();
});

test("shared controls meet target sizes in every theme without overlapping", async ({
  page,
  isMobile,
}) => {
  await page.goto("/design");
  const controls = page.locator("[data-ui]:not(:disabled)");
  if (isMobile) {
    await page.setViewportSize({ width: 844, height: 390 });
    const touchSizes = await controls.evaluateAll((elements) =>
      elements.map((element) => {
        const { width, height } = element.getBoundingClientRect();
        return { width, height };
      })
    );
    for (const size of touchSizes) {
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
    await page.setViewportSize({ width: 390, height: 844 });
  }
  const sizes = await controls.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        label: element.textContent,
      };
    })
  );
  for (const size of sizes) {
    expect(size.width, size.label ?? "control width").toBeGreaterThanOrEqual(
      isMobile ? 44 : 24
    );
    expect(size.height, size.label ?? "control height").toBeGreaterThanOrEqual(
      isMobile ? 44 : 24
    );
  }
  const overlaps = await controls.evaluateAll((elements) =>
    elements.flatMap((element, index) => {
      const a = element.getBoundingClientRect();
      return elements
        .slice(index + 1)
        .filter((other) => {
          const b = other.getBoundingClientRect();
          return (
            a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top
          );
        })
        .map((other) => [element.textContent, other.textContent]);
    })
  );
  expect(overlaps).toEqual([]);
});
