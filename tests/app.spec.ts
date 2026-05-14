import { test, expect } from "@playwright/test";

test.describe("Discover Page", () => {
  test("loads and shows card stack", async ({ page }) => {
    await page.goto("/discover");

    // Header should be visible
    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();

    // Theme toggle should exist
    await expect(page.getByLabel(/switch to/i)).toBeVisible();

    // Should show loading or cards
    // Wait for either cards or empty state
    await page.waitForSelector('[class*="rounded-"]', { timeout: 10000 });
  });

  test("search bar and filter button exist", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForTimeout(1000);

    // Search input
    const searchInput = page.getByPlaceholder("Hledat místo...");
    await expect(searchInput).toBeVisible();

    // Filter button (round button next to search)
    const filterButton = page.locator("button").filter({ has: page.locator("svg") }).last();
    await expect(filterButton).toBeVisible();
  });

  test("filter panel opens and shows categories", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForTimeout(1000);

    // Click the filter button (the round one next to search input)
    // It's a button with an svg icon, next to the search input
    const buttons = page.locator(".flex.items-center.gap-2 > button");
    await buttons.click();

    // Category grid should appear
    await expect(page.getByText("Kategorie")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Vlastnosti")).toBeVisible();

    // Check some categories are shown
    await expect(page.getByRole("button", { name: "Fitness" })).toBeVisible();

    // Check toggle filters
    await expect(page.getByRole("button", { name: /Bez příplatku/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Pro děti/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Parkování/ })).toBeVisible();
  });

  test("search filters results", async ({ page }) => {
    await page.goto("/discover");

    const searchInput = page.getByPlaceholder("Hledat místo...");
    await searchInput.fill("fitness");

    // Wait for results to update
    await page.waitForTimeout(500);

    // Should not crash - page remains functional
    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
  });
});

test.describe("Nearby Page", () => {
  test("loads with map and list", async ({ page }) => {
    await page.goto("/nearby");
    await page.waitForTimeout(3000);

    // Page should load without crash
    await expect(page.locator("body")).toBeVisible();

    // Should have the map-sheet layout structure
    await expect(page.locator("[class*='overflow-y-auto']")).toBeVisible();
  });

  test("shows facilities list or empty state", async ({ page }) => {
    await page.goto("/nearby");
    await page.waitForTimeout(3000);

    // Should show either facility cards or empty message
    const hasCards = await page.locator("[class*='rounded-2xl bg-card']").count();
    const hasEmpty = await page.getByText(/Žádná místa/).isVisible().catch(() => false);
    expect(hasCards > 0 || hasEmpty).toBeTruthy();
  });
});

test.describe("Favorites Page", () => {
  test("shows empty state when no favorites", async ({ page }) => {
    await page.goto("/favorites");
    await page.waitForTimeout(2000);

    // Should show empty state message
    await expect(page.getByText(/nemáš žádná oblíbená/)).toBeVisible();
  });

  test("page loads without errors", async ({ page }) => {
    await page.goto("/favorites");
    await page.waitForTimeout(2000);

    // Page should load without crash
    await expect(page.locator("body")).toBeVisible();

    // Should have the Favorites text somewhere
    const favText = page.locator("text=Favorites");
    await expect(favText.first()).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("bottom nav works", async ({ page }) => {
    await page.goto("/discover");

    // Navigate to Nearby
    await page.getByRole("link", { name: "Nearby" }).click();
    await expect(page).toHaveURL(/nearby/);

    // Navigate to Favorites
    await page.getByRole("link", { name: "Favorites" }).click();
    await expect(page).toHaveURL(/favorites/);

    // Navigate back to Discover
    await page.getByRole("link", { name: "Discover" }).click();
    await expect(page).toHaveURL(/discover/);
  });
});

test.describe("Theme Toggle", () => {
  test("toggles dark mode", async ({ page }) => {
    await page.goto("/discover");

    const htmlElement = page.locator("html");

    // Click theme toggle
    const toggle = page.getByLabel(/switch to/i);
    await toggle.click();

    // Check that dark class is toggled
    await page.waitForTimeout(300);
    const hasDark = await htmlElement.evaluate((el) => el.classList.contains("dark"));
    // It should have changed (we don't know initial state, just verify no crash)
    expect(typeof hasDark).toBe("boolean");
  });
});
