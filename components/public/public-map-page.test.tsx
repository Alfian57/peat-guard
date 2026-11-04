import { afterEach, expect, test } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PublicMapPage } from "@/components/public/public-map-page";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function emptyMapResponse() {
  const timestamp = "2026-11-15T05:00:00.000Z";

  return {
    generatedAt: timestamp,
    viewport: { west: 108, south: -6, east: 119, north: 4 },
    period: "7d",
    source: "all",
    confidence: "all",
    zones: [],
    hotspots: [],
    truncated: { zones: false, hotspots: false },
    freshness: {
      provider: "NASA FIRMS",
      status: "not_configured",
      configured: false,
      checkedAt: timestamp,
      lastSuccessfulAt: null,
      expectedIntervalMinutes: 30,
    },
  };
}

test("shows loading then an empty results state when the public API has no data", async () => {
  let resolveResponse: ((response: Response) => void) | null = null;
  globalThis.fetch = (() =>
    new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    })) as typeof fetch;

  render(<PublicMapPage />);

  expect(screen.getByText("Memuat data untuk filter terpilih…")).toBeDefined();
  await waitFor(() => expect(resolveResponse).not.toBeNull());
  resolveResponse?.(Response.json(emptyMapResponse()));

  expect(
    await screen.findByText(
      "Tidak ada zona disetujui atau hotspot pada rentang filter dan area ini.",
    ),
  ).toBeDefined();
  expect(screen.getByText("Peta dasar belum dikonfigurasi")).toBeDefined();
});

test("shows a retry action for API failure and recovers after retry", async () => {
  const user = userEvent.setup();
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;

    if (calls === 1) {
      return Response.json({ error: "unavailable" }, { status: 503 });
    }

    return Response.json(emptyMapResponse());
  }) as typeof fetch;

  render(<PublicMapPage />);

  expect(await screen.findByRole("alert")).toBeDefined();
  await user.click(screen.getByRole("button", { name: "Coba lagi" }));

  expect(
    await screen.findByText(
      "Tidak ada zona disetujui atau hotspot pada rentang filter dan area ini.",
    ),
  ).toBeDefined();
  expect(calls).toBe(2);
});

test("filter changes submit an allowlisted source query", async () => {
  const user = userEvent.setup();
  const requestUrls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requestUrls.push(String(input));
    return Response.json(emptyMapResponse());
  }) as typeof fetch;

  render(<PublicMapPage />);
  await screen.findByText(
    "Tidak ada zona disetujui atau hotspot pada rentang filter dan area ini.",
  );
  await user.selectOptions(screen.getByLabelText("Sumber hotspot"), "demo");
  await waitFor(() => expect(requestUrls).toHaveLength(2));

  expect(requestUrls[1]).toContain("source=demo");
});
