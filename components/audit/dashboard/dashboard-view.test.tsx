import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

mock.module("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { DashboardView } =
  await import("@/components/audit/dashboard/dashboard-view");

test("dashboard labels the estimate and unavailable history without a readiness score", () => {
  render(
    <DashboardView
      dashboard={{
        activityPeriod: { from: null, to: null },
        asOf: "2026-11-15T00:00:00.000Z",
        calculation: {
          formula: "E_saved = A × B × EF × conversion",
          version: "peatguard-mrv-v1",
        },
        carbonTrend: {
          reason: "MONTHLY_ZONE_HISTORY_NOT_RECORDED",
          status: "unavailable",
        },
        readiness: {
          reason: "READINESS_SCORE_FORMULA_NOT_DEFINED",
          status: "unavailable",
        },
        totals: {
          approvedZoneCount: 0,
          containsIllustrativeData: false,
          estimatedCarbonTons: 0,
          estimatedIncentiveIdr: 0,
          protectedAreaHectares: 0,
        },
        villages: [],
        zones: [],
      }}
      filterError={null}
      from=""
      to=""
    />,
  );

  expect(screen.getByRole("heading", { name: "Dasbor dampak" })).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: /Filter periode aktivitas/ }),
  );
  expect(screen.getByLabelText(/Tanggal mulai periode/)).toBeTruthy();
  expect(screen.getByLabelText(/Tanggal akhir periode/)).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Tren estimasi emisi dicegah" }),
  ).toBeTruthy();
  expect(
    screen.getByText("Perubahan bulanan belum dapat dihitung."),
  ).toBeTruthy();
  const calculation = screen.getByRole("heading", {
    name: "Cara menghitung estimasi emisi dicegah",
  });
  expect(calculation.closest("details")).toBeNull();
  expect(screen.getByText("E_saved = A × B × EF × conversion")).toBeTruthy();
  expect(screen.queryByText("Skor kesiapsiagaan")).toBeNull();
  expect(screen.getByText(/estimasi simulasi/)).toBeTruthy();
});

test("dashboard displays filter validation feedback near the form", () => {
  render(
    <DashboardView
      dashboard={{
        activityPeriod: { from: null, to: null },
        asOf: "2026-11-15T00:00:00.000Z",
        calculation: {
          formula: "E_saved = A × B × EF × conversion",
          version: "peatguard-mrv-v1",
        },
        carbonTrend: {
          reason: "MONTHLY_ZONE_HISTORY_NOT_RECORDED",
          status: "unavailable",
        },
        readiness: {
          reason: "READINESS_SCORE_FORMULA_NOT_DEFINED",
          status: "unavailable",
        },
        totals: {
          approvedZoneCount: 0,
          containsIllustrativeData: false,
          estimatedCarbonTons: 0,
          estimatedIncentiveIdr: 0,
          protectedAreaHectares: 0,
        },
        villages: [],
        zones: [],
      }}
      filterError="Dates must be valid calendar dates in YYYY-MM-DD format."
      from="2026-02-30"
      to="2026-03-01"
    />,
  );

  expect(screen.getByRole("alert").textContent).toContain(
    "valid calendar dates",
  );
});
