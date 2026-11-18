import { test, expect } from "./fixtures/auth.fixture";
import { APP_ROUTES } from "@/lib/routes";

test.describe("MRV Verifier & Carbon Audit Journey", () => {
  test("verifier reviews the dashboard and ledger, then publishes a situation report", async ({
    verifikatorPage: page,
  }) => {
    await page.goto(APP_ROUTES.audit.dashboard);
    await expect(
      page.getByRole("heading", { name: "Tren estimasi emisi dicegah" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Kesiapsiagaan" }),
    ).toBeVisible();

    await page.goto(APP_ROUTES.audit.ledger);
    await expect(
      page.getByRole("heading", { level: 1, name: "Buku besar audit MRV" }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Filter buku besar" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Ekspor data/i }),
    ).toBeVisible();

    await page.goto(APP_ROUTES.audit.generator);
    await expect(
      page.getByRole("heading", { level: 1, name: "Generator laporan MRV" }),
    ).toBeVisible();

    const generateBtn = page.getByRole("button", { name: /Susun laporan/i });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    await expect(
      page.getByRole("heading", { name: "Ringkasan metrik" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Titik panas satelit/i)).toBeVisible();

    await page.getByRole("button", { name: "Terbitkan laporan" }).click();
    const pdfLink = page.getByRole("link", { name: "Unduh PDF" });
    await expect(pdfLink).toBeVisible();
    const pdfPath = await pdfLink.getAttribute("href");
    expect(pdfPath).toBeTruthy();

    await page.goto(APP_ROUTES.audit.documents);
    await expect(
      page.getByRole("heading", { level: 1, name: "Arsip laporan MRV" }),
    ).toBeVisible();
    await expect(page.locator(`a[href="${pdfPath}"]`)).toBeVisible();
    const pdf = await page.request.get(pdfPath!);
    expect(pdf.ok()).toBe(true);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  });
});
