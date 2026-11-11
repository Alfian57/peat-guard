import { test, expect } from "./fixtures/auth.fixture";
import AxeBuilder from "@axe-core/playwright";
import { APP_ROUTES } from "@/lib/routes";

test.describe("Web Accessibility (a11y) WCAG 2.1 AA Audits", () => {
  test("login page meets WCAG accessibility standards", async ({ page }) => {
    await page.goto(APP_ROUTES.login);
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical",
    );
    expect(criticalViolations).toEqual([]);
  });

  test("public map page meets WCAG accessibility standards", async ({
    page,
  }) => {
    await page.goto(APP_ROUTES.publicMap);
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical",
    );
    expect(criticalViolations).toEqual([]);
  });

  test("posko command page meets WCAG accessibility standards", async ({
    poskoPage: page,
  }) => {
    await page.goto(APP_ROUTES.command.map);
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical",
    );
    expect(criticalViolations).toEqual([]);
  });

  test("audit ledger page meets WCAG accessibility standards", async ({
    verifikatorPage: page,
  }) => {
    await page.goto(APP_ROUTES.audit.ledger);
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical",
    );
    expect(criticalViolations).toEqual([]);
  });
});
