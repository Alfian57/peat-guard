import { afterEach, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

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
  fireEvent.click(screen.getByRole("button", { name: "Filter pin laporan" }));
  expect(screen.getByLabelText(/Status penanganan/)).toBeTruthy();
  expect(screen.getByLabelText(/Urgensi AI/)).toBeTruthy();
  expect(
    screen.getByLabelText("Keterangan warna status pin laporan"),
  ).toBeTruthy();
  expect(screen.getByText("Rendah / belum dinilai")).toBeTruthy();
  expect(screen.getByText("Aman / selesai")).toBeTruthy();
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
      return Response.json({
        configured: true,
        lastSuccessfulAt: null,
        lastAttemptAt: null,
        lastErrorCode: null,
        lastProcessedCount: null,
        storedHotspotCount: 0,
      });
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
});
