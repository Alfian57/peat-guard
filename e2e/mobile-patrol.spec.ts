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

    // 3. Tap the Lapor tab in bottom navigation
    const createNavBtn = bottomNav.getByRole("link", {
      name: "Lapor",
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

  test("public map fits the mobile viewport while the menu scrolls independently", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 620 });
    await page.goto(APP_ROUTES.publicMap);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.publicMap));

    // Back link is visible and tap-friendly
    const backBtn = page.getByLabel("Kembali ke beranda PEATGUARD");
    await expect(backBtn).toBeVisible();

    const map = page.getByRole("region", { name: "Peta interaktif publik" });
    const menuButton = page.getByRole("button", { name: "Menu peta" });
    const menu = page.getByRole("complementary", {
      name: "Filter dan hasil peta",
    });
    await expect(map).toBeInViewport({ ratio: 1 });
    const mapBounds = await map.boundingBox();
    await expect(menu).toBeHidden();
    await expect(
      page.getByRole("button", {
        name: "Status data satelit",
        includeHidden: true,
      }),
    ).toBeAttached();

    await menuButton.tap();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toBeVisible();
    await menu.evaluate((panel) => panel.scrollTo(0, panel.scrollHeight));
    await expect
      .poll(() => menu.evaluate((panel) => panel.scrollTop))
      .toBeGreaterThan(0);
    expect(await map.boundingBox()).toEqual(mapBounds);

    const satelliteStatus = menu.getByRole("button", {
      name: "Status data satelit",
    });
    const statusPopover = page.getByRole("dialog", {
      name: "Status data satelit",
    });
    await satelliteStatus.tap();
    await expect(statusPopover).toBeInViewport({ ratio: 1 });
    await satelliteStatus.tap();
    await expect(statusPopover).toBeHidden();

    await menuButton.tap();
    await expect(menu).toBeHidden();
    expect(
      await page.evaluate(() => {
        const root = document.documentElement;
        return (
          root.scrollWidth === root.clientWidth &&
          root.scrollHeight === root.clientHeight
        );
      }),
    ).toBe(true);
  });
});
