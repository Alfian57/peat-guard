import { test, expect } from "./fixtures/auth.fixture";
import { APP_ROUTES } from "@/lib/routes";

test.describe("Role-Based Access Control (RBAC) & Route Security Guard", () => {
  test("anonymous users are redirected to login when accessing protected areas", async ({
    page,
  }) => {
    // Attempt accessing POSKO command center
    await page.goto(APP_ROUTES.command.map);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.login));

    // Attempt accessing MRV audit ledger
    await page.goto(APP_ROUTES.audit.ledger);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.login));

    // Attempt accessing Field report
    await page.goto(APP_ROUTES.field.report);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.login));
  });

  test("relawan is redirected away from command center and audit ledger", async ({
    relawanPage: page,
  }) => {
    // 1. Relawan attempts to access command center layout -> redirected to home
    await page.goto(APP_ROUTES.command.map);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.home));

    // 2. Relawan is redirected away from audit routes by the audit layout.
    await page.goto(APP_ROUTES.audit.ledger);
    await expect(page).toHaveURL(new RegExp(APP_ROUTES.home));
  });

  test("posko is blocked from audit ledger", async ({ poskoPage: page }) => {
    // Posko attempts to access audit ledger -> access denied warning
    await page.goto(APP_ROUTES.audit.ledger);
    await expect(
      page.getByRole("heading", {
        name: /Halaman ini memerlukan akses Verifikator karbon/i,
      }),
    ).toBeVisible();
  });
});
