import { test, expect } from "./fixtures/auth.fixture";
import { APP_ROUTES, API_ROUTES } from "@/lib/routes";

test.describe("Water Points & Conservation Zones Governance", () => {
  test("posko views water points and verifies zone approval governance boundary", async ({
    poskoPage: page,
  }) => {
    // 1. Posko visits water points management page
    await page.goto(APP_ROUTES.command.waterPoints);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.command.waterPoints));

    const pageHeading = page.locator("h1");
    await expect(pageHeading).toContainText(/Titik sumber air/i);

    const addBtn = page.getByRole("link", { name: /Tambah titik air/i });
    await expect(addBtn).toBeVisible();

    // 2. Posko visits conservation zones list page
    await page.goto(APP_ROUTES.command.zones);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.command.zones));

    const zonesHeading = page.locator("h1");
    await expect(zonesHeading).toContainText(/Zona gambut/i);

    // 3. Posko visits zone creator page
    await page.goto(APP_ROUTES.command.createZone);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.command.createZone));

    // Verify Posko has NO approval action on the zone creator
    const approveButton = page.getByRole("button", {
      name: /Setujui zona/i,
    });
    await expect(approveButton).toHaveCount(0);

    // 4. Verify API security boundary: POSKO role receives 403 Forbidden on approve endpoint
    const dummyZoneId = "00000000-0000-4000-8000-000000000001";
    const approveResponse = await page.request.post(
      API_ROUTES.command.zoneApprove(dummyZoneId),
    );
    expect(approveResponse.status()).toBe(403);
  });

  test("verifikator is authorized to access zone approval endpoint", async ({
    verifikatorPage: page,
  }) => {
    // Verifikator calls approve endpoint - should NOT be 401 or 403
    // It may return 400 or 404 for a non-existent zone ID, but not 403 Forbidden!
    const dummyZoneId = "00000000-0000-4000-8000-000000000001";
    const approveResponse = await page.request.post(
      API_ROUTES.command.zoneApprove(dummyZoneId),
    );
    expect(approveResponse.status()).not.toBe(401);
    expect(approveResponse.status()).not.toBe(403);
  });
});
