import { test, expect, ensureFieldReportExists } from "./fixtures/auth.fixture";
import { APP_ROUTES } from "@/lib/routes";

test.describe("Posko Dispatcher & Incident Management Journey", () => {
  test("posko coordinator views incident queue, opens report, and updates handling status", async ({
    poskoPage: page,
  }) => {
    // 0. Ensure at least one report exists in DB
    await ensureFieldReportExists();

    // 1. Posko navigates to incidents queue
    await page.goto(APP_ROUTES.command.reports);
    await expect(page.locator("h1")).toContainText(/Antrean laporan/i);

    // 2. Locate first report in the list
    const firstReportLink = page
      .locator("a[href*='/command/reports/']")
      .first();
    await expect(firstReportLink).toBeVisible({ timeout: 15_000 });
    await firstReportLink.click();

    // 3. Verify report detail page loaded
    await page.waitForURL(/\/command\/reports\/.+/, { timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /Update status/i }),
    ).toBeVisible();

    // 4. Click 'Update status' to open status dialog
    await page.getByRole("button", { name: /Update status/i }).click();
    await expect(
      page.getByRole("heading", { name: /Update status penanganan/i }),
    ).toBeVisible();

    // 5. Select 'Dalam penanganan' radio option
    const dalamPenangananRadio = page.locator(
      'input[name="nextStatus"][value="DALAM_PENANGANAN"]',
    );
    await dalamPenangananRadio.check();

    // 6. Enter dispatcher coordination note
    const noteArea = page.locator(
      'textarea[placeholder*="Catat arahan atau hasil koordinasi"]',
    );
    await noteArea.fill(
      "Tim regu pemadam terdekat telah dikerahkan ke titik koordinat.",
    );

    // 7. Save status update
    const saveBtn = page.getByRole("button", {
      name: /Simpan pembaruan status/i,
    });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // 8. Assert status badge changed or success message is visible
    await expect(page.getByText(/Status laporan diperbarui/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
