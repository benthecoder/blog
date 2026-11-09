import { expect, test } from "@playwright/test";

test("syllabus sections share one frame and one rhythm", async ({ page }) => {
  await page.goto("/syllabus");
  const frames = await page
    .locator("section[aria-labelledby]")
    .evaluateAll((sections) =>
      sections.map((section) => {
        const heading = section.querySelector("h2")!;
        const body = section.querySelector(":scope > div")!;
        const box = (el: Element) => el.getBoundingClientRect();
        return {
          title: heading.textContent,
          size: getComputedStyle(heading).fontSize,
          top: box(section).top,
          bottom: box(section).bottom,
          // Space from the heading (or its note) to the content.
          inside: Math.round(
            box(body).top - box(body.previousElementSibling!).bottom
          ),
        };
      })
    );
  expect(frames.map((frame) => frame.title)).toEqual([
    "progress",
    "enrolled this semester",
    "up next",
  ]);
  // Headings sit one step above 16px body text.
  expect(new Set(frames.map((frame) => frame.size))).toEqual(new Set(["20px"]));
  expect(frames.every((frame) => frame.inside === 16)).toBe(true);
  const gaps = frames
    .slice(1)
    .map((frame, index) => Math.round(frame.top - frames[index].bottom));
  expect(gaps).toEqual([48, 48]);
});

test("syllabus rows fit a phone and mark only real late work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/syllabus");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const rows = page.locator("#enrolled ~ div li");
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toContainText("due ");
  // Zero counts are not drawn in red; the progress line shows them plainly.
  const red = await page
    .locator(".text-danger")
    .evaluateAll((els) => els.map((el) => el.textContent?.trim()));
  expect(red.every((text) => text && !text.startsWith("0 "))).toBe(true);
  await expect(
    page.getByText(/\d+ late · \d+ missed · streak \d+/)
  ).toBeVisible();
});
