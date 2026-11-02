import { mock, test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";

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

mock.module("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-source={src} role="img" />
  ),
}));

const { LedgerView } = await import("@/components/audit/ledger/ledger-view");

const filters = {
  aiState: null,
  evidence: "all" as const,
  page: 1,
  pageSize: 25,
  range: null,
  zoneId: null,
};

const ledger = {
  filters: {
    aiState: null,
    evidence: "all" as const,
    from: null,
    to: null,
    zoneId: null,
  },
  page: 1,
  pageSize: 25,
  rows: [
    {
      aiTriage: {
        category: "ASAP_GAMBUT",
        confidence: 0.94,
        state: "COMPLETED",
        urgency: "WASPADA",
      },
      coordinates: {
        accuracyMeters: 17.5,
        latitude: -2.3194,
        longitude: 113.9102,
        status: "recorded_not_verified" as const,
      },
      createdAt: "2026-11-15T02:25:00.000Z",
      capturedAt: "2026-11-15T02:24:00.000Z",
      evidenceStatus: "complete" as const,
      hasPhoto: true,
      handlingStatus: "MENUNGGU_TINDAKAN",
      isDemoSample: false,
      photoHref: "/api/reports/61000000-0000-4000-8000-000000000001/photo",
      reportId: "61000000-0000-4000-8000-000000000001",
      statusHistory: [],
      syncedAt: "2026-11-15T02:31:00.000Z",
      villageName: "Desa Contoh",
      zoneImpactContext: null,
    },
  ],
  total: 30,
};

test("ledger shows factual GPS evidence, private photo link, filters, and pagination", () => {
  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={ledger}
      to=""
      zones={[]}
    />,
  );

  expect(screen.getByLabelText("Wilayah zona")).toBeTruthy();
  expect(screen.getByLabelText("Kelengkapan bukti")).toBeTruthy();
  expect(
    screen.getByText("Koordinat tercatat · belum diverifikasi"),
  ).toBeTruthy();
  expect(screen.getByText("Akurasi perangkat: 17,5 m")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Buka foto bukti laporan 61000000" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Ekspor CSV" }).getAttribute("href"),
  ).toContain("format=csv");
  expect(
    screen
      .getByRole("link", { name: "Halaman berikutnya" })
      .getAttribute("href"),
  ).toContain("page=2");
  expect(
    screen.getByText(/Estimasi emisi zona ditampilkan sebagai konteks/),
  ).toBeTruthy();
});

test("ledger shows a clear empty state and preserves filter errors", () => {
  render(
    <LedgerView
      filterError="Parameter aiState tidak valid."
      filters={filters}
      from=""
      ledger={{ ...ledger, rows: [], total: 0 }}
      to=""
      zones={[]}
    />,
  );

  expect(screen.getByRole("alert").textContent).toContain("aiState");
  expect(screen.getByText("Tidak ada catatan yang cocok")).toBeTruthy();
  expect(screen.getByText(/Menampilkan 0–0 dari 0 catatan/)).toBeTruthy();
});
