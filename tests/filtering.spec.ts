import { test, expect } from "@playwright/test";

test.describe("Category Filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/discover/");
    // Wait for category pills to render
    await page.waitForSelector("button:has-text('Vše')", { timeout: 10000 });
  });

  test("should show all facilities when 'Vše' is selected", async ({ page }) => {
    // "Vše" button should be active by default
    const allButton = page.locator("button", { hasText: "Vše" });
    await expect(allButton).toHaveClass(/bg-foreground/);

    // Should show counter with facilities
    const counter = page.locator("text=/\\d+ \\/ \\d+/");
    await expect(counter).toBeVisible();
  });

  test("should filter to fitness when Fitness pill is clicked", async ({ page }) => {
    // Click Fitness pill
    const fitnessPill = page.locator("button", { hasText: "Fitness" });
    await fitnessPill.click();

    // Wait for re-render
    await page.waitForTimeout(500);

    // Fitness pill should now be active (dark background)
    await expect(fitnessPill).toHaveClass(/bg-foreground/);

    // "Vše" should no longer be active
    const allButton = page.locator("button", { hasText: "Vše" });
    await expect(allButton).toHaveClass(/bg-secondary/);

    // Counter should show fewer items than "all"
    const counter = page.locator("text=/\\d+ \\/ \\d+/");
    await expect(counter).toBeVisible();
    const text = await counter.textContent();
    // Should not be empty (fitness has 187 items)
    expect(text).toMatch(/\d+ \/ \d+/);
    const total = parseInt(text!.split("/")[1].trim());
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(572); // Less than all
  });

  test("should filter to yoga when Jóga pill is clicked", async ({ page }) => {
    const yogaPill = page.locator("button", { hasText: "Jóga" });
    await yogaPill.click();
    await page.waitForTimeout(500);

    await expect(yogaPill).toHaveClass(/bg-foreground/);

    const counter = page.locator("text=/\\d+ \\/ \\d+/");
    await expect(counter).toBeVisible();
    const text = await counter.textContent();
    const total = parseInt(text!.split("/")[1].trim());
    expect(total).toBeGreaterThan(0);
  });

  test("should reset to all when clicking Vše after a filter", async ({ page }) => {
    // First filter to fitness
    await page.locator("button", { hasText: "Fitness" }).click();
    await page.waitForTimeout(500);

    const counterAfterFilter = await page.locator("text=/\\d+ \\/ \\d+/").textContent();
    const filteredTotal = parseInt(counterAfterFilter!.split("/")[1].trim());

    // Now click "Vše"
    await page.locator("button", { hasText: "Vše" }).click();
    await page.waitForTimeout(500);

    const counterAfterAll = await page.locator("text=/\\d+ \\/ \\d+/").textContent();
    const allTotal = parseInt(counterAfterAll!.split("/")[1].trim());

    // All should be more than filtered
    expect(allTotal).toBeGreaterThan(filteredTotal);
  });
});
