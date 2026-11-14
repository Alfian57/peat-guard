import path from "node:path";
import { test, expect } from "./fixtures/auth.fixture";
import { APP_ROUTES } from "@/lib/routes";

test.describe("Offline-First & Field Queue Synchronization", () => {
  test("relawan creates report in offline mode, stores in local outbox, and syncs when online", async ({
    relawanPage: page,
  }) => {
    // 1. Navigate to field report create page
    await page.goto(APP_ROUTES.field.createReport);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.field.createReport));

    // 2. Toggle simulated offline mode
    const offlineToggle = page.locator(
      'button[aria-label="Simulasikan mode offline"]:visible',
    );
    await expect(offlineToggle).toBeVisible();
    await offlineToggle.click();
    await expect(offlineToggle).toHaveAttribute("aria-pressed", "true");

    // 3. Populate report form fields
    const testAssetPath = path.resolve(
      process.cwd(),
      "e2e/fixtures/test-assets/patrol-sample.webp",
    );
    const demoSampleBtn = page.getByRole("button", {
      name: /Sampel demo · Asap gambut/i,
    });
    if (await demoSampleBtn.isVisible()) {
      await demoSampleBtn.click();
    } else {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(testAssetPath);
    }

    await page.fill('input[placeholder="-2.319400"]', "-2.319400");
    await page.fill('input[placeholder="113.910200"]', "113.910200");

    const offlineNote = `Patroli offline mandiri ${Date.now()}`;
    await page.fill(
      'textarea[placeholder*="Jelaskan kondisi sekitar"]',
      offlineNote,
    );

    // 4. Submit form while offline
    const submitBtn = page.getByRole("button", { name: "Simpan laporan" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 5. Must redirect automatically to field queue with offline status
    await page.waitForURL(
      (url) => url.pathname.includes(APP_ROUTES.field.queue),
      {
        timeout: 10000,
      },
    );
    await expect(page.getByText(/Sedang offline/i)).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Draf di perangkat" })
        .getByText(/Menunggu sinkronisasi/i),
    ).toBeVisible();

    // 6. Restore connectivity by toggling simulated offline off
    const restoreToggle = page.locator(
      'button[aria-label="Simulasikan mode offline"]:visible',
    );
    await restoreToggle.click();
    await expect(restoreToggle).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText(/Koneksi tersedia/i)).toBeVisible();

    // 7. Connectivity restored: auto-sync triggers, or trigger manual sync if button active
    const syncBtn = page.getByRole("button", { name: "Sinkronkan semua" });
    try {
      await syncBtn.click({ timeout: 2000 });
    } catch {
      // Auto-sync already initiated or completed upon reconnecting
    }

    // 8. Verify the draft reaches server or successfully synchronizes
    await expect(
      page.getByText(/0 menunggu · \d+ terkirim ke posko/i),
    ).toBeVisible({
      timeout: 15000,
    });
  });
});
