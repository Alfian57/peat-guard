import { afterEach, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const { CommandMapScreen } =
  await import("@/components/command/map/command-map-screen");

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

    return Response.json({
      configured: false,
      lastSuccessfulAt: null,
      lastAttemptAt: null,
      lastErrorCode: null,
      lastProcessedCount: null,
      storedHotspotCount: 0,
    });
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
  expect(screen.getByLabelText("Status penanganan")).toBeTruthy();
  expect(screen.getByLabelText("Urgensi AI")).toBeTruthy();
  expect(
    screen.getByLabelText("Keterangan warna urgensi pin laporan"),
  ).toBeTruthy();
  expect(screen.getAllByText("Belum dinilai").length).toBeGreaterThan(1);
  expect(requestedReportPins).toHaveLength(0);
  expect(
    screen
      .getByRole("button", { name: "Sinkronkan NASA FIRMS" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
