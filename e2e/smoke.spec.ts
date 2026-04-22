import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/lately/i);
});

test("theme toggle changes color scheme", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /toggle color scheme/i });
  await expect(toggle).toBeVisible();
  await toggle.click();
  const htmlClass = await page.evaluate(
    () => document.documentElement.className
  );
  expect(htmlClass).toContain("dark");
});
