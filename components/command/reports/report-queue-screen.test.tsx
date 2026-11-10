import { afterEach, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const originalFetch = globalThis.fetch;
const { ReportQueueScreen } =
  await import("@/components/command/reports/report-queue-screen");

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("shows filter controls and the empty state when no reports match", async () => {
  const user = userEvent.setup();
  globalThis.fetch = mock(async (input) => {
    const url = String(input);
    if (url === "/api/command/zones") {
      return Response.json({ zones: [] });
    }
    return Response.json({ reports: [], page: 1, pageSize: 25, total: 0 });
  }) as typeof fetch;

  render(<ReportQueueScreen />);

  expect(await screen.findByText("Tidak ada laporan yang sesuai")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Filter insiden" }));
  expect(screen.getByLabelText(/Zona gambut/)).toBeTruthy();
  expect(screen.getByLabelText(/Dari tanggal/)).toBeTruthy();
  expect(screen.getByLabelText(/Sampai tanggal/)).toBeTruthy();
  expect(screen.getByLabelText(/Data demonstrasi/)).toBeTruthy();
});

test("shows a retry action when the report endpoint fails", async () => {
  globalThis.fetch = mock(async () =>
    Response.json({ error: "Antrean sedang tidak tersedia." }, { status: 503 }),
  ) as typeof fetch;

  render(<ReportQueueScreen />);

  expect(
    await screen.findByText("Antrean sedang tidak tersedia."),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Coba lagi" })).toBeTruthy();
});

test("applies status and zone filters and shows the requested page", async () => {
  const user = userEvent.setup();
  const requestedUrls: string[] = [];
  globalThis.fetch = mock(async (input) => {
    const url = String(input);
    requestedUrls.push(url);
    if (url === "/api/command/zones") {
      return Response.json({ zones: [zone] });
    }
    const params = new URLSearchParams(url.split("?")[1]);
    if (params.get("pageSize") === "1") {
      return Response.json({ reports: [], page: 1, pageSize: 1, total: 31 });
    }
    const page = Number(params.get("page"));
    return Response.json({
      reports: [
        {
          ...report,
          id: page === 1 ? report.id : "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          handlingStatus: params.get("status") ?? report.handlingStatus,
        },
      ],
      page,
      pageSize: 25,
      total: 31,
    });
  }) as typeof fetch;

  render(<ReportQueueScreen />);
  await screen.findByRole("link", { name: "Lihat detail laporan PG-AAAAAAAA" });

  await user.click(screen.getByRole("button", { name: "Filter insiden" }));
  await user.selectOptions(screen.getByLabelText(/Zona gambut/), zone.id);
  await user.click(screen.getByRole("button", { name: /Terapkan/ }));
  expect(await screen.findByText("Zona: Zona Utara")).toBeTruthy();
  expect(requestedUrls.some((url) => url.includes(`zoneId=${zone.id}`))).toBe(
    true,
  );

  await user.click(screen.getByRole("button", { name: /Dalam penanganan/ }));
  await screen.findByRole("link", {
    name: "Lihat detail laporan PG-AAAAAAAA",
  });
  await user.click(screen.getByRole("button", { name: "Berikutnya" }));
  await screen.findByText("2 / 2");
  expect(await screen.findByText("PG-BBBBBBBB")).toBeTruthy();
  expect(
    requestedUrls.some(
      (url) =>
        url.includes("status=DALAM_PENANGANAN") && url.includes("page=2"),
    ),
  ).toBe(true);
});

const zone = {
  id: "6a57d28f-d424-4e4c-90c4-66208b10b755",
  slug: "zona-utara",
  name: "Zona Utara",
  villageName: null,
  peatDepthMeters: 1.5,
  areaHectares: 20,
  carbonFactor: 45,
  emissionFactor: 2.75,
  incentivePerTonIdr: 100000,
  isApproved: true,
  isDemoData: false,
  geometry: { type: "Polygon", coordinates: [] },
};

const report = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  zoneId: zone.id,
  latitude: -1.25,
  longitude: 114.75,
  accuracyMeters: 8,
  capturedAt: "2026-11-15T02:00:00.000Z",
  syncedAt: "2026-11-15T02:10:00.000Z",
  handlingStatus: "MENUNGGU_TINDAKAN" as const,
  aiState: "COMPLETED" as const,
  aiCategory: "ASAP_GAMBUT" as const,
  aiUrgency: "WASPADA" as const,
  isDemoSample: false,
  hasPhoto: true,
  photoHref: "/api/reports/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/photo",
};
