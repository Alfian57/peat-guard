import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { FieldBottomNav } from "./field-bottom-nav";
import { fieldNavigationRoute } from "./field-navigation-state";
import { APP_ROUTES } from "@/lib/routes";

test("field report routes keep the appropriate navigation tab active", () => {
  expect(fieldNavigationRoute(APP_ROUTES.field.home)).toBe("home");
  expect(fieldNavigationRoute(APP_ROUTES.field.createReport)).toBe("create");
  expect(fieldNavigationRoute(APP_ROUTES.field.queue)).toBe("queue");
  expect(fieldNavigationRoute(APP_ROUTES.field.report)).toBe("queue");
  expect(fieldNavigationRoute(APP_ROUTES.field.reportDetail("local-id"))).toBe(
    "queue",
  );
  expect(fieldNavigationRoute(APP_ROUTES.field.reportEdit("local-id"))).toBe(
    "queue",
  );
});

test("bottom navigation exposes three links and announces the queue count separately", () => {
  render(<FieldBottomNav activeRoute="queue" queueCount={105} />);
  expect(screen.getAllByRole("link")).toHaveLength(3);
  expect(
    screen.getByRole("link", { name: "Antrean" }).getAttribute("aria-current"),
  ).toBe("page");
  expect(screen.getByRole("link", { name: "Lapor" }).getAttribute("href")).toBe(
    APP_ROUTES.field.createReport,
  );
  expect(
    screen.getByRole("link", { name: "Beranda" }).hasAttribute("aria-current"),
  ).toBe(false);
  expect(screen.getByText("105 laporan menunggu sinkronisasi")).toBeTruthy();
  expect(screen.getByText("99+").getAttribute("aria-hidden")).toBe("true");
});

test("bottom navigation omits the queue badge when there are no pending drafts", () => {
  render(<FieldBottomNav activeRoute="create" queueCount={0} />);
  expect(
    screen.getByRole("link", { name: "Lapor" }).getAttribute("aria-current"),
  ).toBe("page");
  expect(screen.queryByText(/laporan menunggu sinkronisasi/)).toBeNull();
});
