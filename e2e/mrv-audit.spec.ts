import { test, expect } from "./fixtures/auth.fixture";
import { APP_ROUTES } from "@/lib/routes";

test.describe("MRV Verifier & Carbon Audit Journey", () => {
  test("verifier views evidence ledger and generates situation audit report", async ({
    verifikatorPage: page,
  }) => {
    // 1. Verifikator arrives at audit dashboard or navigates to ledger
    await page.goto(APP_ROUTES.audit.ledger);
    await expect(page.locator("h1")).toContainText(/Buku besar audit MRV/i);

    // 2. Verify filter and export controls exist
    await expect(
      page.getByRole("button", { name: "Filter buku besar" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Ekspor data/i }),
    ).toBeVisible();

    // 3. Navigate to report generator
    await page.goto(APP_ROUTES.audit.generator);
    await expect(page.locator("h1")).toContainText(/Generator laporan MRV/i);

    // 4. Submit form to generate situation report preview (without third-party AI call)
    const generateBtn = page.getByRole("button", { name: /Susun laporan/i });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 5. Assert document preview renders canonical metrics
    await expect(page.getByText(/Pratinjau dokumen/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Ringkasan metrik" }),
    ).toBeVisible();
    await expect(page.getByText(/Titik panas satelit/i)).toBeVisible();
  });
});
