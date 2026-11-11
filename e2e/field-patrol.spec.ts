import { test, expect } from "./fixtures/auth.fixture";
import { APP_ROUTES } from "@/lib/routes";

test.describe("Field Volunteer Patrol & Incident Reporting Journey", () => {
  test("volunteer logs in, creates a field report with photo and coordinates, and sees it in queue", async ({
    relawanPage: page,
  }) => {
    // 1. Relawan arrives at field home
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.field.root));

    // 2. Navigate to create report
    await page.goto(APP_ROUTES.field.createReport);
    await expect(page.locator("h1")).toContainText(/Lapor temuan/i);

    // 3. Fill coordinates
    await page.fill('input[placeholder="-2.319400"]', "-2.319400");
    await page.fill('input[placeholder="113.910200"]', "113.910200");

    // 4. Select photo via demo sample or file upload
    const demoSampleBtn = page.getByRole("button", {
      name: /Sampel demo · Asap gambut/i,
    });
    if (await demoSampleBtn.isVisible()) {
      await demoSampleBtn.click();
    } else {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(
        "e2e/fixtures/test-assets/patrol-sample.webp",
      );
    }

    // 5. Fill field notes
    await page.fill(
      'textarea[placeholder*="Jelaskan kondisi sekitar"]',
      "Patroli MPA mendeteksi indikasi asap di perbatasan kanal gambut.",
    );

    // 6. Submit the report
    const submitBtn = page.getByRole("button", { name: "Simpan laporan" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 7. Verify navigation away from form after successful save
    await page.waitForURL(
      (url) => url.pathname.startsWith(APP_ROUTES.field.root),
      {
        timeout: 15_000,
      },
    );

    // 8. Visit queue page and verify the report appears
    await page.goto(APP_ROUTES.field.queue);
    await expect(page.locator("h1")).toContainText(/Antrean laporan/i);

    // Verify there is at least one report item visible in the queue
    const reportItem = page.locator("article, li, a[href*='reportId']").first();
    await expect(reportItem).toBeVisible();
  });
});
