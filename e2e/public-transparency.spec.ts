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
    await expect(page.getByText("Kesatuan Hidrologis")).toBeVisible();
    await expect(page.getByText("Kawasan lindung gambut")).toBeVisible();
    await expect(page.getByText("Cadangan karbon")).toBeVisible();
  });

  test("public map page renders map shell, controls, and filters without runtime error", async ({
    page,
  }) => {
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
