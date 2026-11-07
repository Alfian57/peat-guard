import { afterEach, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { MrvGeneratedReport } from "@/lib/server/mrv/contracts";

import { GeneratorForm } from "./generator-form";

const originalFetch = globalThis.fetch;
const baseReport: MrvGeneratedReport = {
  canalCondition: {
    reason: "CANAL_CONDITION_NOT_RECORDED",
    status: "unavailable",
  },
  containsIllustrativeData: false,
  documentType: "CARBON_AUDIT",
  generatedAt: "2026-11-15T02:00:00.000Z",
  narrative: {
    headline: "Koordinasi lapangan mendukung respons yang terarah.",
    narrative:
      "Tim dapat meninjau bukti yang tersedia sebelum menentukan tindak lanjut.",
    recommendations: ["Pertahankan koordinasi antarpetugas."],
    status: "generated",
  },
  metrics: {
    carbon: {
      asOf: "2026-11-15T02:00:00.000Z",
      approvedZoneCount: 0,
      containsIllustrativeData: false,
      estimatedCarbonTons: 0,
      estimatedIncentiveIdr: 0,
      protectedAreaHectares: 0,
      reason: null,
      status: "available",
      zones: [],
    },
    hotspots: { demoCount: 0, nonDemoCount: 6, totalCount: 6 },
    reports: {
      activeCount: 3,
      aiTriagedCount: 5,
      closedCount: 1,
      demoCount: 0,
      nonDemoActiveCount: 3,
      nonDemoAiTriagedCount: 5,
      nonDemoClosedCount: 1,
      nonDemoCount: 6,
      totalCount: 6,
    },
    responseTime: {
      averageMinutes: 12.5,
      definition: "RECEIVED_TO_FIRST_IN_PROGRESS",
      nonDemoAverageMinutes: 12.5,
      nonDemoRespondedReportCount: 2,
      respondedReportCount: 2,
      status: "available",
    },
  },
  printable: {
    generatedAt: "2026-11-15T02:00:00.000Z",
    language: "id-ID",
    period: { from: "2026-11-01", to: "2026-11-15" },
    sections: [],
    title: "Laporan Audit Karbon Bulanan PEATGUARD",
  },
  scope: {
    from: "2026-11-01",
    to: "2026-11-15",
    zoneId: null,
    zoneName: null,
  },
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("generator submits explicit consent and shows the server-derived preview", async () => {
  const user = userEvent.setup();
  const fetchMock = mock(async () => Response.json(baseReport));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  const printMock = mock(() => undefined);
  window.print = printMock;

  render(<GeneratorForm zones={[]} />);
  await user.click(screen.getByRole("radio", { name: /Audit karbon bulanan/ }));
  await user.click(
    screen.getByLabelText(/Saya setuju AI menyusun draf narasi/),
  );
  await user.click(screen.getByRole("button", { name: "Susun laporan" }));

  expect(
    await screen.findByRole("heading", {
      name: "Laporan Audit Karbon Bulanan PEATGUARD",
    }),
  ).toBeTruthy();
  expect(
    screen.getByText("Koordinasi lapangan mendukung respons yang terarah."),
  ).toBeTruthy();
  expect(screen.getByText("Belum tersedia")).toBeTruthy();
  expect(
    screen.getByText(
      "Ilustrasi CO₂e × tarif tersimpan; bukan formula insentif patroli final.",
    ),
  ).toBeTruthy();

  const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
  expect(JSON.parse(String(request.body))).toMatchObject({
    aiConsent: true,
    documentType: "CARBON_AUDIT",
    includeNarrative: true,
  });

  await user.click(screen.getByRole("button", { name: "Cetak / simpan PDF" }));
  expect(printMock).toHaveBeenCalledTimes(1);
});

test("generator reports server errors and keeps the selected date after failure", async () => {
  const user = userEvent.setup();
  const fetchMock = mock(async () =>
    Response.json(
      { error: "Zona tidak ditemukan atau belum disetujui." },
      { status: 404 },
    ),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  render(<GeneratorForm zones={[]} />);
  fireEvent.change(screen.getByLabelText("Dari tanggal"), {
    target: { value: "2026-11-01" },
  });
  await user.click(screen.getByRole("button", { name: "Susun laporan" }));

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Isi kedua tanggal rentang atau kosongkan keduanya.",
  );
  expect(fetchMock).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText("Sampai tanggal"), {
    target: { value: "2026-11-15" },
  });
  await user.click(screen.getByRole("button", { name: "Susun laporan" }));

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Zona tidak ditemukan atau belum disetujui.",
  );
  expect(
    (screen.getByLabelText("Dari tanggal") as HTMLInputElement).value,
  ).toBe("2026-11-01");
});
