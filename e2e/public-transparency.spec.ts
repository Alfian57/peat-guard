import { test, expect } from "@playwright/test";
import { APP_ROUTES, API_ROUTES } from "@/lib/routes";

test.describe("Public Transparency & Map Journeys", () => {
  test("landing page renders hero and loaded carbon restoration metrics", async ({
    page,
  }) => {
    await page.goto(APP_ROUTES.home);

    // Expect hero title and brand mark
    await expect(page.locator("h1")).toContainText(/Lindungi bentang gambut/i);

    // Expect public metric section to be present
    const metricsSection = page.locator("#pantauan");
    await expect(metricsSection).toBeVisible();

    // Verify key metric labels
    await expect(
      metricsSection.getByText("Zona disetujui", { exact: true }),
    ).toBeVisible();
    await expect(
      metricsSection.getByText("Luas zona terhitung", { exact: true }),
    ).toBeVisible();
    await expect(
      metricsSection.getByText("Estimasi emisi dicegah", { exact: true }),
    ).toBeVisible();
  });

  test("landing shows zero detections only with a fresh FIRMS sync", async ({
    page,
  }) => {
    let firmsFreshness = "not_configured";
    await page.route(API_ROUTES.public.metrics, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        json: {
          ...(await response.json()),
          firmsHotspotCount: 0,
          firmsFreshness,
        },
      });
    });
    const card = page
      .getByRole("article")
      .filter({ hasText: "Hotspot NASA FIRMS" });

    await page.goto(APP_ROUTES.home);
    await expect(
      card.getByText(/Sinkronisasi belum dikonfigurasi/),
    ).toBeVisible();
    await expect(card.getByText("0 titik", { exact: true })).toHaveCount(0);

    firmsFreshness = "fresh";
    await page.reload();
    await expect(
      card.getByText("0 titik", { exact: true }).first(),
    ).toBeAttached();
    await expect(
      card.getByText(/Sinkronisasi belum dikonfigurasi/),
    ).toHaveCount(0);
  });

  test("public map page renders map shell, controls, and filters without runtime error", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 540 });
    await page.route(
      (url) => url.pathname === API_ROUTES.public.map,
      async (route) => {
        const response = await route.fetch();
        const data = await response.json();
        await route.fulfill({
          response,
          json: {
            ...data,
            freshness: { ...data.freshness, status: "stale" },
            truncated: { ...data.truncated, hotspots: true },
          },
        });
      },
    );
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto(APP_ROUTES.publicMap);

    // Expect main map screen heading / controls
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Pantauan gambut/i,
    );

    // Filter controls should be visible
    await expect(page.getByLabel(/Waktu pengamatan/i)).toBeVisible();
    await expect(page.getByLabel(/Sumber hotspot/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cari di area peta" }),
    ).toBeVisible();
    await expect(
      page.getByText(/Area pencarian mengikuti batas peta/),
    ).toHaveCount(0);

    const menu = page.getByRole("complementary", {
      name: "Filter dan hasil peta",
    });
    const map = page.getByRole("region", { name: "Peta interaktif publik" });
    await expect(map).toBeInViewport({ ratio: 1 });
    const mapBounds = await map.boundingBox();
    await expect(
      map.getByLabel("Legenda peta").getByText("Data hotspot belum mutakhir"),
    ).toBeVisible();

    const freshness = page.getByRole("dialog", { name: "Status data satelit" });
    await expect(freshness).toBeHidden();
    await menu.getByRole("button", { name: "Status data satelit" }).click();
    await expect(
      freshness.getByText("NASA FIRMS", { exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(freshness).toBeHidden();

    const limitedResults = page.getByRole("dialog", { name: "Hasil dibatasi" });
    await expect(limitedResults).toBeHidden();
    await menu.getByRole("button", { name: "Hasil dibatasi" }).click();
    await expect(
      limitedResults.getByText(/Hasil dibatasi demi kinerja/),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(limitedResults).toBeHidden();

    await menu.evaluate((panel) => {
      panel.scrollTop = 0;
    });
    await menu.hover();
    await page.mouse.wheel(0, 320);
    await expect
      .poll(() => menu.evaluate((panel) => panel.scrollTop))
      .toBeGreaterThan(0);
    expect(await map.boundingBox()).toEqual(mapBounds);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // Verify zero fatal JavaScript page errors
    expect(pageErrors).toHaveLength(0);
  });

  test("public map API preserves data privacy contracts without leaking user identity", async ({
    request,
  }) => {
    const response = await request.get(API_ROUTES.public.map);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty("zones");
    expect(json).toHaveProperty("hotspots");
    expect(Array.isArray(json.zones)).toBe(true);

    const rawPayloadString = JSON.stringify(json);
    // Ensure no private user fields are leaked in public DTO
    expect(rawPayloadString).not.toContain("reporterId");
    expect(rawPayloadString).not.toContain("email");
    expect(rawPayloadString).not.toContain("password");
    expect(rawPayloadString).not.toContain("phoneNumber");
  });
});
