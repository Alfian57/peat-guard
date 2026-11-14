import { expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { APP_ROUTES } from "@/lib/routes";
import { FieldOutboxSection } from "./field-outbox-section";
import { FieldQueueSummary } from "./field-queue-summary";
import { ServerReportHistorySection } from "./server-report-history-section";

const serverProps: ComponentProps<typeof ServerReportHistorySection> = {
  isConnected: false,
  localReports: [],
  onPageChange: () => undefined,
  page: 1,
  pageSize: 25,
  reports: [],
  status: "unavailable",
  total: 0,
  error: null,
};

test("offline queue keeps the create action and explains why remote history cannot load", async () => {
  const user = userEvent.setup();
  const sync = mock(async () => undefined);
  render(
    <>
      <FieldQueueSummary
        hasOwner
        isConnected={false}
        isSyncing={false}
        waitingCount={2}
        sentCount={1}
        onSync={sync}
      />
      <FieldOutboxSection
        isLoading={false}
        drafts={[]}
        onDelete={() => undefined}
      />
      <ServerReportHistorySection {...serverProps} />
    </>,
  );
  expect(screen.getByRole("heading", { name: "Sedang offline" })).toBeTruthy();
  const syncButton = screen.getByRole("button", { name: "Sinkronkan semua" });
  expect(syncButton.hasAttribute("disabled")).toBe(true);
  await user.click(syncButton);
  expect(sync).toHaveBeenCalledTimes(0);
  expect(
    screen.getByRole("link", { name: "Buat laporan" }).getAttribute("href"),
  ).toBe(APP_ROUTES.field.createReport);
  expect(screen.getByRole("status").textContent).toContain(
    "Hubungkan perangkat",
  );
  expect(screen.queryByText("Belum ada laporan terkirim") === null).toBe(true);
});

test("connected queue can sync and prevents another click while syncing", async () => {
  const user = userEvent.setup();
  const sync = mock(async () => undefined);
  const { rerender } = render(
    <FieldQueueSummary
      hasOwner
      isConnected
      isSyncing={false}
      waitingCount={2}
      sentCount={1}
      onSync={sync}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Sinkronkan semua" }));
  expect(sync).toHaveBeenCalledTimes(1);
  rerender(
    <FieldQueueSummary
      hasOwner
      isConnected
      isSyncing
      waitingCount={2}
      sentCount={1}
      onSync={sync}
    />,
  );
  expect(
    screen
      .getByRole("button", { name: "Menyinkronkan…" })
      .hasAttribute("disabled"),
  ).toBe(true);
});

test("remote history distinguishes loaded empty results from failed requests", () => {
  const { rerender } = render(
    <ServerReportHistorySection {...serverProps} isConnected status="loaded" />,
  );
  expect(screen.getByText("Belum ada laporan terkirim")).toBeTruthy();
  expect(screen.queryByRole("status") === null).toBe(true);
  rerender(
    <ServerReportHistorySection
      {...serverProps}
      isConnected
      status="error"
      error="Koneksi posko terputus."
    />,
  );
  expect(screen.getByRole("alert").textContent).toContain(
    "Koneksi posko terputus.",
  );
  expect(screen.queryByText("Belum ada laporan terkirim") === null).toBe(true);
});
