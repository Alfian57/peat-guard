import { test, expect } from "./fixtures/auth.fixture";
import { APP_ROUTES } from "@/lib/routes";

test.describe("Mobile Viewport & Touch Interaction", () => {
  test.use({
    viewport: { width: 393, height: 851 },
    hasTouch: true,
    isMobile: true,
  });

  test("relawan interacts with mobile bottom navigation bar and mobile form controls", async ({
    relawanPage: page,
  }) => {
    // 1. Visit field home on mobile viewport
    await page.goto(APP_ROUTES.field.home);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.field.home));

    // 2. Bottom navigation bar must be visible on mobile
    const bottomNav = page.locator('nav[aria-label="Navigasi relawan"]');
    await expect(bottomNav).toBeVisible();

    // 3. Tap "+ Lapor temuan" button in bottom nav
    const createNavBtn = bottomNav.getByRole("link", {
      name: "+ Lapor temuan",
    });
    await createNavBtn.click();
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.field.createReport));

    // 4. Mobile form controls verification (no horizontal overflow)
    const headerTitle = page.getByRole("heading", { name: "Lapor temuan" });
    await expect(headerTitle).toBeVisible();

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    // 5. Tap "Antrean" button in bottom nav
    const queueNavBtn = bottomNav.getByRole("link", { name: "Antrean" });
    await queueNavBtn.click();
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.field.queue));

    const queueTitle = page.getByRole("heading", { name: "Antrean laporan" });
    await expect(queueTitle).toBeVisible();
  });

  test("public map layout fits mobile viewport without horizontal scrolling", async ({
    page,
  }) => {
    await page.goto(APP_ROUTES.publicMap);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.publicMap));

    // Back link is visible and tap-friendly
    const backBtn = page.getByLabel("Kembali ke beranda PEATGUARD");
    await expect(backBtn).toBeVisible();

    // Check page width does not cause horizontal scroll
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
