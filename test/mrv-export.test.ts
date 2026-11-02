import { describe, expect, test } from "bun:test";

import { serializeMrvLedgerCsv } from "@/lib/server/mrv/export";
import type { MrvLedger } from "@/lib/server/mrv/contracts";

const ledger: MrvLedger = {
  filters: {
    aiState: null,
    evidence: "all",
    from: null,
    to: null,
    zoneId: null,
  },
  page: 1,
  pageSize: 25,
  total: 1,
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
        status: "recorded_not_verified",
      },
      createdAt: "2026-11-15T02:31:00.000Z",
      capturedAt: "2026-11-15T02:24:00.000Z",
      evidenceStatus: "complete",
      hasPhoto: true,
      handlingStatus: "MENUNGGU_TINDAKAN",
      isDemoSample: true,
      photoHref: "/api/reports/61000000-0000-4000-8000-000000000001/photo",
      reportId: "61000000-0000-4000-8000-000000000001",
      statusHistory: [
        {
          actorRole: "POSKO",
          createdAt: "2026-11-15T02:31:00.000Z",
          eventId: "62000000-0000-4000-8000-000000000001",
          nextStatus: "MENUNGGU_TINDAKAN",
          previousStatus: null,
        },
      ],
      syncedAt: "2026-11-15T02:31:00.000Z",
      villageName: "Desa Contoh",
      zoneImpactContext: {
        areaHectares: 100,
        attribution: "current_zone_context_not_patrol_contribution",
        calculationVersion: "peatguard-mrv-v1",
        estimatedCarbonTons: 3_670,
        estimatedIncentiveIdr: 55_050_000,
        isDemoData: true,
        isIllustrative: true,
        parameters: {
          biomassFactorTonsCarbonPerHectare: 50,
          co2ConversionFactor: 3.67,
          emissionFactor: 0.2,
          incentivePerTonIdr: 15_000,
          isDemoData: true,
          name: "FigCraft demo values",
          parameterSetId: "63000000-0000-4000-8000-000000000001",
        },
        villageName: "Desa Contoh",
        zoneId: "64000000-0000-4000-8000-000000000001",
        zoneName: '=HYPERLINK("x","click")',
      },
    },
  ],
};

describe("MRV CSV export", () => {
  test("quotes fields, protects spreadsheet formulas, and keeps numeric GPS values", () => {
    const csv = serializeMrvLedgerCsv(ledger);
    const dataRow = csv.split("\r\n")[1];

    expect(csv.startsWith('"report_id","captured_at"')).toBe(true);
    expect(dataRow).toContain("'=HYPERLINK");
    expect(dataRow).toContain('"-2.3194","113.9102"');
    expect(dataRow).toContain('"17.5"');
    expect(csv.split("\r\n")[0]).toContain(
      "zone_carbon_estimate_tons_context_only",
    );
    expect(dataRow).toContain("recorded_not_verified");
    expect(dataRow).toContain("complete");
    expect(dataRow).toContain(
      "/api/reports/61000000-0000-4000-8000-000000000001/photo",
    );
  });

  test("protects formulas preceded by a newline", () => {
    const row = ledger.rows[0];
    const newlineLedger: MrvLedger = {
      ...ledger,
      rows: [
        {
          ...row,
          zoneImpactContext: row.zoneImpactContext
            ? {
                ...row.zoneImpactContext,
                zoneName: '\n=HYPERLINK("x","click")',
              }
            : null,
        },
      ],
    };
    const csv = serializeMrvLedgerCsv(newlineLedger);

    expect(csv).toContain("'\n=HYPERLINK");
  });
});
