import { expect, test } from "@playwright/test";

test("preview follows placement, stays hoverable and dismisses with Escape", async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    "Touch links navigate; hover previews are a pointer interaction."
  );
  await page.goto("/design");
  const trigger = page.getByRole("link", {
    name: "inline preview",
    exact: true,
  });
  // Leave room to place the same real trigger against either viewport edge.
  await page.evaluate(() => {
    document.body.style.paddingBottom = "100vh";
  });
  await trigger.evaluate((element) =>
    element.scrollIntoView({ block: "start" })
  );
  await trigger.focus();
  const tooltip = page.getByRole("tooltip");
  const card = tooltip.locator(".post-link-preview");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveAttribute("data-placement", /^bottom/);
  const bottomOrigin = await card.evaluate(
    (element) => getComputedStyle(element).transformOrigin.split(" ")[1]
  );
  expect(parseFloat(bottomOrigin)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(tooltip).not.toBeVisible();
  await trigger.blur();
  await trigger.evaluate((element) =>
    element.scrollIntoView({ block: "center" })
  );
  await trigger.hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveAttribute("data-placement", /^top/);
  const linkRect = (await trigger.boundingBox())!;
  const tooltipRect = (await tooltip.boundingBox())!;
  const from = {
    x: linkRect.x + linkRect.width / 2,
    y: linkRect.y + linkRect.height / 2,
  };
  const to = {
    x: tooltipRect.x + tooltipRect.width / 2,
    y: tooltipRect.y + tooltipRect.height / 2,
  };
  // Exercise the gap between the link and the preview, not just the endpoints.
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * step) / 10,
      from.y + ((to.y - from.y) * step) / 10
    );
    await expect(tooltip).toBeVisible();
  }
  await expect(card).toHaveAttribute("data-status", "open");
  const origin = await card.evaluate((element) => ({
    y: parseFloat(getComputedStyle(element).transformOrigin.split(" ")[1]),
    height: element.getBoundingClientRect().height,
  }));
  expect(origin.y).toBeCloseTo(origin.height, 0);
  await page.keyboard.press("Escape");
  await expect(tooltip).not.toBeVisible();
});

test("reduced motion removes preview scaling and respects live preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design");
  await page.getByRole("link", { name: "inline preview", exact: true }).focus();
  const card = page.getByRole("tooltip").locator(".post-link-preview");
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS("transform", "none");
  await expect(card).toHaveCSS("transition-property", "opacity");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(card).toHaveCSS("transition-property", "opacity, transform");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(card).toHaveCSS("transform", "none");
});

test("a failed lazy preview retries on the next focus without blocking its link", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/post-preview/ask", async (route) => {
    if (++requests === 1)
      await route.fulfill({ status: 503, body: "Unavailable" });
    else
      await route.fulfill({
        json: {
          slug: "ask",
          title: "Ask For What You Want",
          date: "2024-01-10",
          excerpt: "Ask for what you want.",
        },
      });
  });
  await page.goto("/design");
  const trigger = page.getByRole("link", {
    name: "fetched preview",
    exact: true,
  });
  const failedResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/post-preview/ask") &&
      response.status() === 503
  );
  await trigger.focus();
  await failedResponse;
  // Give the component's response handlers a render turn before refocusing.
  // The preview deliberately does not consume a failed response's body.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  );
  await expect(trigger).toHaveAttribute("href", "/posts/ask");
  await trigger.blur();
  await trigger.focus();
  await expect(page.getByRole("tooltip")).toContainText(
    "Ask For What You Want"
  );
});

for (const theme of ["light", "dark"]) {
  test(`preview text has readable contrast across all palettes in ${theme} mode`, async ({
    page,
  }) => {
    await page.addInitScript(
      (mode) => localStorage.setItem("theme", mode),
      theme
    );
    await page.goto("/design");
    await page
      .getByRole("link", { name: "inline preview", exact: true })
      .focus();
    const card = page.getByRole("tooltip").locator(".post-link-preview");
    await expect(card).toHaveAttribute("data-status", "open");
    for (const palette of [
      "indigo",
      "olive",
      "gold",
      "steel",
      "vermillion",
      "rose",
    ]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.palette = value;
      }, palette);
      const ratios = await card.evaluate((element) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d")!;
        const luminance = (color: string) => {
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const rgb = context.getImageData(0, 0, 1, 1).data;
          const linear = Array.from(rgb)
            .slice(0, 3)
            .map((v) => v / 255)
            .map((v) =>
              v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
            );
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
        };
        const background = luminance(getComputedStyle(element).backgroundColor);
        return Array.from(element.querySelectorAll("p")).map((text) => {
          const foreground = luminance(getComputedStyle(text).color);
          return (
            (Math.max(background, foreground) + 0.05) /
            (Math.min(background, foreground) + 0.05)
          );
        });
      });
      for (const ratio of ratios)
        expect(ratio, `${theme} ${palette}`).toBeGreaterThanOrEqual(4.5);
    }
  });
}
