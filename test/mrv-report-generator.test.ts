import { describe, expect, mock, test } from "bun:test";

import {
  buildMrvGeneratedReport,
  type NarrativeProvider,
} from "@/lib/server/mrv/report-calculations";
import type {
  ApprovedZoneValues,
  MrvReportRequest,
} from "@/lib/server/mrv/contracts";
import type { MrvReportSource } from "@/lib/server/mrv/report-data";

const illustrativeZone: ApprovedZoneValues = {
  areaHectares: 200,
  biomassFactor: 50,
  co2ConversionFactor: 3.67,
  emissionFactor: 0.2,
  incentivePerTonIdr: 15_000,
  isDemoData: true,
  name: "FigCraft demo values (illustrative)",
  parameterIsDemoData: true,
  parameterSetId: "60000000-0000-4000-8000-000000000001",
  villageName: "Desa Demo",
  zoneId: "61000000-0000-4000-8000-000000000001",
  zoneName: "Zona Demo",
};

const observedZone: ApprovedZoneValues = {
  ...illustrativeZone,
  areaHectares: 100,
  biomassFactor: 25,
  emissionFactor: 0.15,
  isDemoData: false,
  name: "Operator configured",
  parameterIsDemoData: false,
  parameterSetId: "60000000-0000-4000-8000-000000000002",
  villageName: "Desa A",
  zoneId: "61000000-0000-4000-8000-000000000002",
  zoneName: "Zona A",
};

const source: MrvReportSource = {
  hotspots: { demoCount: 2, nonDemoCount: 5, totalCount: 7 },
  reports: {
    activeCount: 4,
    aiTriagedCount: 7,
    closedCount: 2,
    demoActiveCount: 1,
    demoAiTriagedCount: 2,
    demoClosedCount: 1,
    demoCount: 3,
    demoRespondedCount: 1,
    demoResponseMinutes: 8,
    nonDemoActiveCount: 3,
    nonDemoAiTriagedCount: 5,
    nonDemoClosedCount: 1,
    nonDemoCount: 6,
    nonDemoRespondedCount: 2,
    nonDemoResponseMinutes: 12.5,
    respondedCount: 3,
    responseMinutes: 11,
    totalCount: 9,
  },
  zones: [illustrativeZone, observedZone],
};

const reportRequest: MrvReportRequest = {
  aiConsent: true,
  documentType: "SITUATION",
  filters: { range: null, zoneId: null },
  includeNarrative: true,
};

describe("MRV situation report generation", () => {
  test("sends only anonymous aggregates and keeps server metrics canonical", async () => {
    const receivedInputs: unknown[] = [];
    const provider: NarrativeProvider = async (input) => {
      receivedInputs.push(input);
      return {
        headline: "Patroli dan tindak lanjut berjalan.",
        narrative: "Catatan lapangan mendukung tindak lanjut terarah.",
        recommendations: ["Pertahankan koordinasi antartim."],
      };
    };

    const report = await buildMrvGeneratedReport(
      reportRequest,
      source,
      provider,
      new Date("2026-11-15T00:00:00.000Z"),
    );

    expect(receivedInputs).toHaveLength(1);
    expect(receivedInputs[0]).toEqual({
      consent: true,
      metrics: {
        activeReportCount: 3,
        aiTriagedReportCount: 5,
        averageResponseMinutes: 12.5,
        closedReportCount: 1,
        estimatedCarbonTons: 1_376.25,
        estimatedIncentiveIdr: 20_643_750,
        fieldReportCount: 6,
        reportsWithResponseTime: 2,
        satelliteHotspotCount: 5,
      },
    });
    expect(report.metrics.carbon.estimatedCarbonTons).toBe(8_716.25);
    expect(report.metrics.reports.totalCount).toBe(9);
    expect(report.metrics.hotspots.totalCount).toBe(7);
    expect(report.narrative.status).toBe("generated");
    expect(report.canalCondition.status).toBe("unavailable");
    expect(report.containsIllustrativeData).toBe(true);
  });

  test("accepts a qualitative narrative longer than 200 characters", async () => {
    const narrative =
      "Koordinasi lapangan membantu tim menjalankan tindak lanjut dengan baik. ".repeat(
        5,
      );
    const provider: NarrativeProvider = mock(async () => ({
      headline: "Koordinasi lapangan mendukung tindak lanjut.",
      narrative,
      recommendations: ["Pertahankan koordinasi antartim."],
    }));

    expect(narrative.length).toBeGreaterThan(200);

    const report = await buildMrvGeneratedReport(
      reportRequest,
      source,
      provider,
    );

    expect(report.narrative).toMatchObject({
      narrative,
      status: "generated",
    });
  });

  test("rejects AI numeric claims without changing database metrics", async () => {
    const provider: NarrativeProvider = mock(async () => ({
      headline: "There were 9999 reports.",
      narrative: "The model must not set official numbers.",
      recommendations: ["Review the response process."],
    }));

    const report = await buildMrvGeneratedReport(
      reportRequest,
      source,
      provider,
      new Date("2026-11-15T00:00:00.000Z"),
    );

    expect(report.narrative).toEqual({
      reason: "NARRATIVE_PROVIDER_FAILED",
      status: "unavailable",
    });
    expect(report.metrics.carbon.estimatedCarbonTons).toBe(8_716.25);
    expect(report.metrics.reports.totalCount).toBe(9);
  });

  test("rejects Unicode numbers, number words, and units but allows qualitative text", async () => {
    const rejectedClaims = [
      "Tercatat ² laporan.",
      "Dukungan Rp perlu dipastikan.",
      "Emisi per ton perlu ditinjau.",
      "Puluhan patroli perlu ditindaklanjuti.",
      "Jutaan rupiah masih perlu ditinjau.",
      "Sebagian besar wilayah perlu dipantau.",
      "Setengah jalur perlu diperiksa.",
      "Several reports need follow up.",
      "The process is more consistent.",
      "Laporan meningkat pada periode ini.",
      "The response improved in the last period.",
      "Satu-satunya jalur tindak lanjut perlu dipastikan.",
    ];

    for (const claim of rejectedClaims) {
      const provider: NarrativeProvider = mock(async () => ({
        headline: "Ringkasan tersedia.",
        narrative: claim,
        recommendations: ["Perkuat koordinasi."],
      }));
      const report = await buildMrvGeneratedReport(
        reportRequest,
        source,
        provider,
      );

      expect(report.narrative.status).toBe("unavailable");
    }

    const qualitativeProvider: NarrativeProvider = mock(async () => ({
      headline: "Kesiapsiagaan terjaga.",
      narrative:
        "Koordinasi lapangan membantu tim menjalankan tindak lanjut dengan baik.",
      recommendations: ["Pertahankan koordinasi antartim."],
    }));
    const qualitativeReport = await buildMrvGeneratedReport(
      reportRequest,
      source,
      qualitativeProvider,
    );

    expect(qualitativeReport.narrative.status).toBe("generated");
  });

  test("does not call the provider below the minimum non-demo aggregate count", async () => {
    const provider: NarrativeProvider = mock(async () => ({
      headline: "Patroli berjalan.",
      narrative: "Tim mencatat aktivitas lapangan.",
      recommendations: ["Lanjutkan pemantauan."],
    }));
    const lowCountSource: MrvReportSource = {
      ...source,
      reports: { ...source.reports, nonDemoCount: 4 },
    };

    const report = await buildMrvGeneratedReport(
      reportRequest,
      lowCountSource,
      provider,
    );

    expect(provider).not.toHaveBeenCalled();
    expect(report.narrative).toEqual({
      reason: "INSUFFICIENT_AGGREGATE_REPORTS",
      status: "unavailable",
    });
  });

  test("returns explicit empty and unavailable metrics when no data exists", async () => {
    const emptySource: MrvReportSource = {
      hotspots: { demoCount: 0, nonDemoCount: 0, totalCount: 0 },
      reports: {
        activeCount: 0,
        aiTriagedCount: 0,
        closedCount: 0,
        demoActiveCount: 0,
        demoAiTriagedCount: 0,
        demoClosedCount: 0,
        demoCount: 0,
        demoRespondedCount: 0,
        demoResponseMinutes: null,
        nonDemoActiveCount: 0,
        nonDemoAiTriagedCount: 0,
        nonDemoClosedCount: 0,
        nonDemoCount: 0,
        nonDemoRespondedCount: 0,
        nonDemoResponseMinutes: null,
        respondedCount: 0,
        responseMinutes: null,
        totalCount: 0,
      },
      zones: [],
    };

    const report = await buildMrvGeneratedReport(reportRequest, emptySource);

    expect(report.metrics.hotspots.totalCount).toBe(0);
    expect(report.metrics.reports.totalCount).toBe(0);
    expect(report.metrics.carbon.estimatedCarbonTons).toBe(0);
    expect(report.metrics.responseTime).toMatchObject({
      averageMinutes: null,
      respondedReportCount: 0,
      status: "unavailable",
    });
    expect(report.narrative).toEqual({
      reason: "INSUFFICIENT_AGGREGATE_REPORTS",
      status: "unavailable",
    });
  });

  test("uses the selected document type in the printable report title", async () => {
    const report = await buildMrvGeneratedReport(
      {
        ...reportRequest,
        aiConsent: false,
        documentType: "CARBON_AUDIT",
        includeNarrative: false,
      },
      source,
    );

    expect(report.documentType).toBe("CARBON_AUDIT");
    expect(report.printable.title).toBe(
      "Laporan Audit Karbon Bulanan PEATGUARD",
    );
  });

  test("does not call a narrative provider when the user declines", async () => {
    const provider: NarrativeProvider = mock(async () => ({
      headline: "Tidak digunakan.",
      narrative: "Narasi tidak diminta.",
      recommendations: [],
    }));

    const report = await buildMrvGeneratedReport(
      { ...reportRequest, aiConsent: false, includeNarrative: false },
      source,
      provider,
    );

    expect(provider).not.toHaveBeenCalled();
    expect(report.narrative).toEqual({ status: "not_requested" });
  });
});
