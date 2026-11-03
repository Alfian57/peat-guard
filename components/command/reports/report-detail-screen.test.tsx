import { afterEach, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const originalFetch = globalThis.fetch;

mock.module("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <span aria-label={alt} data-source={src} role="img" />
  ),
}));

const { ReportDetailScreen } =
  await import("@/components/command/reports/report-detail-screen");

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("updates status with a note and reloads the status history", async () => {
  const user = userEvent.setup();
  let savedInput: unknown;
  let currentReport = makeReport();
  globalThis.fetch = mock(async (input, init) => {
    const url = String(input);
    if (url === "/api/command/zones") return Response.json({ zones: [zone] });
    if (init?.method === "PATCH") {
      savedInput = JSON.parse(String(init.body));
      const inputData = savedInput as { nextStatus: "SELESAI" };
      currentReport = makeReport("SELESAI", [
        {
          id: "event-1",
          previousStatus: "MENUNGGU_TINDAKAN",
          nextStatus: inputData.nextStatus,
          note: "Tim lapangan sudah memadamkan api.",
          createdAt: "2026-11-15T02:30:00.000Z",
        },
      ]);
      return Response.json({ id: reportId, status: inputData.nextStatus });
    }
    return Response.json({ report: currentReport });
  }) as typeof fetch;

  render(<ReportDetailScreen reportId={reportId} />);

  expect(
    await screen.findByRole("heading", { name: "Insiden PG-AAAAAAAA" }),
  ).toBeTruthy();
  expect(screen.getByText("Bukti lapangan")).toBeTruthy();
  expect(screen.queryByText(/Budi Santoso/)).toBeNull();

  await user.click(screen.getByRole("button", { name: "Update status" }));
  await user.click(screen.getByRole("radio", { name: "Selesai" }));
  await user.type(
    screen.getByLabelText(/Catatan penanganan/),
    "Tim lapangan sudah memadamkan api.",
  );
  await user.click(
    screen.getByRole("button", { name: "Simpan pembaruan status" }),
  );

  expect(
    await screen.findByText("Status laporan berhasil diperbarui."),
  ).toBeTruthy();
  expect(
    await screen.findByText("Tim lapangan sudah memadamkan api."),
  ).toBeTruthy();
  expect(savedInput).toEqual({
    expectedStatus: "MENUNGGU_TINDAKAN",
    nextStatus: "SELESAI",
    note: "Tim lapangan sudah memadamkan api.",
  });
  expect(screen.getAllByText("Selesai").length).toBeGreaterThan(1);
});

test("preserves dialog values and reports a failed status update", async () => {
  const user = userEvent.setup();
  globalThis.fetch = mock(async (input, init) => {
    const url = String(input);
    if (url === "/api/command/zones") return Response.json({ zones: [zone] });
    if (init?.method === "PATCH") {
      return Response.json(
        { error: "Status laporan belum dapat disimpan." },
        { status: 503 },
      );
    }
    return Response.json({ report: makeReport() });
  }) as typeof fetch;

  render(<ReportDetailScreen reportId={reportId} />);
  await screen.findByRole("heading", { name: "Insiden PG-AAAAAAAA" });
  await user.click(screen.getByRole("button", { name: "Update status" }));
  await user.click(screen.getByRole("radio", { name: "Dalam penanganan" }));
  const note = screen.getByLabelText(/Catatan penanganan/);
  await user.type(note, "Dikerahkan ke lokasi");
  await user.click(
    screen.getByRole("button", { name: "Simpan pembaruan status" }),
  );

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Status laporan belum dapat disimpan.",
  );
  expect((note as HTMLTextAreaElement).value).toBe("Dikerahkan ke lokasi");
  expect(
    (
      screen.getByRole("radio", {
        name: "Dalam penanganan",
      }) as HTMLInputElement
    ).checked,
  ).toBe(true);
});

const reportId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const zone = {
  id: "6a57d28f-d424-4e4c-90c4-66208b10b755",
  slug: "zona-utara",
  name: "Zona Utara",
  villageName: "Desa Utara",
  peatDepthMeters: 1.5,
  areaHectares: 20,
  carbonFactor: 45,
  emissionFactor: 2.75,
  incentivePerTonIdr: 100000,
  isApproved: true,
  isDemoData: false,
  geometry: { type: "Polygon", coordinates: [] },
};

function makeReport(
  handlingStatus: "MENUNGGU_TINDAKAN" | "SELESAI" = "MENUNGGU_TINDAKAN",
  statusEvents: Array<{
    id: string;
    previousStatus: "MENUNGGU_TINDAKAN" | null;
    nextStatus: "SELESAI";
    note: string | null;
    createdAt: string;
  }> = [],
) {
  return {
    id: reportId,
    clientReportId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    zoneId: zone.id,
    latitude: -1.25,
    longitude: 114.75,
    accuracyMeters: 8,
    fieldNotes: "Asap terlihat dari sisi kanal.",
    tags: ["asap", "kanal"],
    capturedAt: "2026-11-15T02:00:00.000Z",
    syncedAt: "2026-11-15T02:10:00.000Z",
    aiConsent: true,
    aiState: "COMPLETED",
    aiCategory: "ASAP_GAMBUT",
    aiUrgency: "WASPADA",
    aiConfidence: 0.91,
    aiSummary: "Asap terlihat pada lahan gambut.",
    aiVisualIndicators: ["Asap tipis"],
    aiFalsePositiveCheck: "Tidak tampak kabut awan.",
    aiActionRecommendations: ["Periksa titik dari sisi aman."],
    aiAnalyzedAt: "2026-11-15T02:11:00.000Z",
    handlingStatus,
    nearestWaterDistanceM: 140,
    isDemoSample: false,
    createdAt: "2026-11-15T02:00:00.000Z",
    updatedAt: "2026-11-15T02:10:00.000Z",
    photoHref: `/api/reports/${reportId}/photo`,
    statusEvents,
  };
}
