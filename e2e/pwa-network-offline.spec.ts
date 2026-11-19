import { test, expect } from "./fixtures/auth.fixture";
import { prisma } from "@/lib/prisma";
import { APP_ROUTES } from "@/lib/routes";

test("production PWA reopens offline and syncs an edited canal observation only once", async ({
  relawanPage: page,
  context,
}) => {
  test.skip(
    process.env.E2E_PRODUCTION !== "1",
    "Requires a production build with the service worker enabled.",
  );
  test.setTimeout(90_000);
  await page.goto(APP_ROUTES.field.home);
  await expect(page.getByText("Siap offline", { exact: true })).toBeVisible({
    timeout: 25_000,
  });

  const notes = `Observasi sekat saat offline ${Date.now()}`;
  await context.setOffline(true);
  try {
    // Reload a document after warmup, then navigate through the actual field links.
    await page.reload({ waitUntil: "domcontentloaded" });
    await page
      .getByRole("main")
      .getByRole("link", { name: "Lapor temuan" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Lapor temuan" }),
    ).toBeVisible();
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles("e2e/fixtures/test-assets/patrol-sample.webp");
    await page.getByPlaceholder("-2.319400").fill("-2.3194");
    await page.getByPlaceholder("113.910200").fill("113.9102");
    await page.getByPlaceholder(/Jelaskan kondisi sekitar/).fill(notes);
    await page
      .getByRole("combobox", { name: "Kondisi sekat kanal" })
      .selectOption("KERING");
    await page.getByRole("button", { name: "Simpan laporan" }).click();

    const drafts = page.getByRole("region", { name: "Draf di perangkat" });
    await expect(drafts.getByText(/Menunggu sinkronisasi/i)).toBeVisible();
    await drafts.getByRole("link").first().click();
    await page.getByRole("link", { name: "Edit laporan tersimpan" }).click();
    await expect(page.getByPlaceholder(/Jelaskan kondisi sekitar/)).toHaveValue(
      notes,
    );
    await expect(
      page.getByRole("combobox", { name: "Kondisi sekat kanal" }),
    ).toHaveValue("KERING");
    await page
      .getByRole("combobox", { name: "Kondisi sekat kanal" })
      .selectOption("RUSAK");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(drafts.getByText(/Menunggu sinkronisasi/i)).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
  await expect
    .poll(
      () =>
        prisma.fieldReport.count({
          where: { fieldNotes: notes, canalCondition: "RUSAK" },
        }),
      { timeout: 25_000 },
    )
    .toBe(1);
  await page.reload();
  await expect(
    page.getByText(/0 menunggu · \d+ terkirim ke posko/i),
  ).toBeVisible();
  expect(await prisma.fieldReport.count({ where: { fieldNotes: notes } })).toBe(
    1,
  );
});

test("known volunteer saves a draft when session networking fails while the browser is online", async ({
  relawanPage: page,
}) => {
  test.setTimeout(90_000);
  await page.goto(APP_ROUTES.field.home);
  await expect(
    page.getByText("Terhubung ke posko", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem("peatguard:field:last-relawan-owner:v1"),
      ),
    )
    .toBeTruthy();

  const sessionRoute = "**/api/auth/get-session*";
  await page.route(sessionRoute, (route) => route.abort("connectionfailed"));
  await page.goto(APP_ROUTES.field.createReport);
  expect(await page.evaluate(() => navigator.onLine)).toBe(true);

  const submit = page.getByRole("button", { name: "Simpan laporan" });
  const notes = `Draf saat sesi tidak dapat dijangkau ${Date.now()}`;
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles("e2e/fixtures/test-assets/patrol-sample.webp");
  await page.getByPlaceholder("-2.319400").fill("-2.3194");
  await page.getByPlaceholder("113.910200").fill("113.9102");
  await page.getByPlaceholder(/Jelaskan kondisi sekitar/).fill(notes);
  await expect(submit).toBeEnabled();
  await submit.click();

  const drafts = page.getByRole("region", { name: "Draf di perangkat" });
  await expect(drafts.getByText(/Menunggu sinkronisasi/i)).toBeVisible();
  expect(await prisma.fieldReport.count({ where: { fieldNotes: notes } })).toBe(
    0,
  );

  await page.unroute(sessionRoute);
  await expect
    .poll(
      () =>
        prisma.fieldReport.count({
          where: { fieldNotes: notes },
        }),
      { timeout: 25_000 },
    )
    .toBe(1);
});
