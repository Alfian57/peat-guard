import { afterEach, expect, mock, test } from "bun:test";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { MapCanvasProps } from "@/components/maps/map-canvas";
import { MapConfigurationState } from "@/components/maps/map-configuration-state";
import { MapLoadingState } from "@/components/maps/map-loading-state";
import { API_ROUTES } from "@/lib/routes";

const originalFetch = globalThis.fetch;
let publishViewport: MapCanvasProps["onViewportChange"];

function firmsStatusResponse(configured = false) {
  return Response.json({
    configured,
    freshness: configured ? "unavailable" : "not_configured",
    expectedIntervalMinutes: 30,
    lastSuccessfulAt: null,
    lastDataSyncAt: null,
    lastAttemptAt: null,
    lastOutcome: null,
    lastErrorCode: null,
    lastFailedSources: [],
    lastProcessedCount: null,
    storedHotspotCount: 0,
  });
}

// Treat WebGL and its viewport events as a browser boundary.
mock.module("@/components/maps/map-canvas-loader", () => ({
  MapLoadingState,
  MapCanvasLoader: (props: MapCanvasProps) => {
    publishViewport = props.onViewportChange;
    return <MapConfigurationState />;
  },
}));

afterEach(() => {
  globalThis.fetch = originalFetch;
  publishViewport = undefined;
});

const { CommandMapScreen } =
  await import("@/components/command/map/command-map-screen");

test("ignores viewport jitter and keeps the last report count while a new area loads", async () => {
  const requests: string[] = [];
  let finishRefresh: ((response: Response) => void) | undefined;
  globalThis.fetch = mock(async (input) => {
    const url = String(input);
    if (url === API_ROUTES.command.map) {
      return Response.json({ zones: [], waterPoints: [], hotspots: [] });
    }
    if (url.startsWith(API_ROUTES.command.reportMapPoints)) {
      requests.push(url);
      if (requests.length === 1) {
        return Response.json({ points: [], truncated: false, limit: 250 });
      }
      return new Promise<Response>((resolve) => {
        finishRefresh = resolve;
      });
    }
    return firmsStatusResponse();
  }) as typeof fetch;

  render(<CommandMapScreen />);
  await screen.findByText("Peta dasar belum dikonfigurasi");
  const viewport = { west: 113, south: -3, east: 115, north: -1 };
  act(() => publishViewport?.(viewport));
  expect(
    screen.getByRole("status", { name: "Memuat laporan pada area peta" }),
  ).toBeTruthy();
  await screen.findByText("0 laporan pada area peta.");

  act(() =>
    publishViewport?.({ ...viewport, north: viewport.north + 0.0000001 }),
  );
  expect(screen.getByText("0 laporan pada area peta.")).toBeTruthy();
  // Equivalent rounded bounds must not schedule another request.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 190));
  });
  expect(requests).toHaveLength(1);

  act(() => publishViewport?.({ ...viewport, north: 0 }));
  await waitFor(() => expect(requests).toHaveLength(2));
  expect(screen.getByText("0 laporan pada area peta.")).toBeTruthy();
  expect(
    screen.queryByRole("status", { name: "Memuat laporan pada area peta" }),
  ).toBeNull();

  await act(async () =>
    finishRefresh?.(
      Response.json({
        points: [
          {
            id: "report-1",
            latitude: -2,
            longitude: 114,
            capturedAt: "2026-11-18T02:00:00.000Z",
            aiUrgency: null,
            aiCategory: null,
            handlingStatus: "MENUNGGU_TINDAKAN",
            isDemoSample: false,
          },
        ],
        truncated: false,
        limit: 250,
      }),
    ),
  );
  await screen.findByText("1 laporan pada area peta.");
});

test("keeps report filters visible when the map has no configured viewport", async () => {
  const requestedReportPins: string[] = [];
  globalThis.fetch = mock(async (input) => {
    const url = String(input);
    if (url === "/api/command/map") {
      return Response.json({ zones: [], waterPoints: [], hotspots: [] });
    }
    if (url.startsWith("/api/command/reports/map-points")) {
      requestedReportPins.push(url);
      return Response.json({ points: [], truncated: false, limit: 250 });
    }

    return firmsStatusResponse();
  }) as typeof fetch;

  render(<CommandMapScreen />);

  expect(
    await screen.findByText("Peta dasar belum dikonfigurasi"),
  ).toBeTruthy();
  expect(
    screen.getByRole("checkbox", { name: "Titik sumber air" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("checkbox", { name: "Tampilkan pin laporan" }),
  ).toBeTruthy();
  const waterLayer = screen.getByRole("checkbox", {
    name: "Titik sumber air",
  }) as HTMLInputElement;
  fireEvent.click(waterLayer);
  expect(waterLayer.checked).toBe(false);
  fireEvent.click(waterLayer);
  expect(waterLayer.checked).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: /^Filter$/i }));
  expect(screen.getByLabelText(/Status penanganan/)).toBeTruthy();
  expect(screen.getByLabelText(/Urgensi AI/)).toBeTruthy();
  expect(
    screen.getByLabelText("Keterangan warna status pin laporan"),
  ).toBeTruthy();
  expect(screen.getByText("Urgensi AI rendah / belum dinilai")).toBeTruthy();
  expect(screen.getByText("Aman / terkendali atau selesai")).toBeTruthy();
  expect(requestedReportPins).toHaveLength(0);
  expect(
    screen
      .getByRole("button", { name: "Sinkronkan NASA FIRMS" })
      .hasAttribute("disabled"),
  ).toBe(true);
});

test("shows a shared FIRMS cooldown as an informational status", async () => {
  const message =
    "Sinkronisasi baru dapat dilakukan setelah interval berikutnya.";
  globalThis.fetch = mock(async (input) => {
    const url = String(input);
    if (url === "/api/command/map") {
      return Response.json({ zones: [], waterPoints: [], hotspots: [] });
    }
    if (url === "/api/command/firms") {
      return firmsStatusResponse(true);
    }
    if (url === "/api/command/firms/sync") {
      return Response.json({ error: "rate_limited", message }, { status: 429 });
    }

    return Response.json({ points: [], truncated: false, limit: 250 });
  }) as typeof fetch;

  render(<CommandMapScreen />);
  const syncButton = await screen.findByRole("button", {
    name: "Sinkronkan NASA FIRMS",
  });
  fireEvent.click(syncButton);

  const cooldownNotice = await screen.findByText(message);
  expect(cooldownNotice.getAttribute("role")).toBe("status");
  expect(cooldownNotice.closest("details")).toBeNull();
  const disclosure = screen.getByText("NASA FIRMS").closest("summary")!;
  expect(disclosure.closest("details")?.open).toBe(false);
  fireEvent.click(disclosure);
  expect(disclosure.closest("details")?.open).toBe(true);
});

test("keeps pins on unchanged apply and discards cancelled filter changes", async () => {
  const requests: string[] = [];
  globalThis.fetch = mock(async (input) => {
    const url = String(input);
    if (url === API_ROUTES.command.map)
      return Response.json({ zones: [], waterPoints: [], hotspots: [] });
    if (url.startsWith(API_ROUTES.command.reportMapPoints)) {
      requests.push(url);
      return Response.json({ points: [], truncated: false, limit: 250 });
    }
    return firmsStatusResponse();
  }) as typeof fetch;
  render(<CommandMapScreen />);
  await screen.findByText("Peta dasar belum dikonfigurasi");
  act(() => publishViewport?.({ west: 113, south: -3, east: 115, north: -1 }));
  await screen.findByText("0 laporan pada area peta.");

  fireEvent.click(screen.getByRole("button", { name: "Filter" }));
  fireEvent.click(screen.getByRole("button", { name: "Terapkan" }));
  expect(screen.getByText("0 laporan pada area peta.")).toBeTruthy();
  expect(requests).toHaveLength(1);

  fireEvent.click(screen.getByRole("button", { name: "Filter" }));
  fireEvent.change(screen.getByLabelText(/Status penanganan/), {
    target: { value: "MENUNGGU_TINDAKAN" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Batal" }));
  expect(screen.getByText("Semua pin laporan")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Filter" }));
  expect(screen.getByLabelText(/Status penanganan/)).toHaveProperty(
    "value",
    "all",
  );
});
