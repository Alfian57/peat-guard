import { describe, expect, test } from "bun:test";

import {
  buildMrvDashboard,
  calculateZoneImpact,
} from "@/lib/server/mrv/calculations";
import type {
  ApprovedZoneValues,
  VillageActivity,
} from "@/lib/server/mrv/contracts";

const demoZone: ApprovedZoneValues = {
  areaHectares: 200,
  biomassFactor: 50,
  co2ConversionFactor: 3.67,
  emissionFactor: 0.2,
  incentivePerTonIdr: 15_000,
  isDemoData: true,
  name: "FigCraft demo values (illustrative)",
  parameterIsDemoData: true,
  parameterSetId: "60000000-0000-4000-8000-000000000001",
  villageName: "Desa Contoh",
  zoneId: "61000000-0000-4000-8000-000000000001",
  zoneName: "Zona Contoh",
};

describe("MRV deterministic calculations", () => {
  test("calculates carbon and incentive from the zone parameter set", () => {
    const impact = calculateZoneImpact(demoZone);

    expect(impact.estimatedCarbonTons).toBe(7_340);
    expect(impact.estimatedIncentiveIdr).toBe(110_100_000);
    expect(impact.isIllustrative).toBe(true);
    expect(impact.parameters.parameterSetId).toBe(demoZone.parameterSetId);
    expect(impact.parameters.biomassFactorTonsCarbonPerHectare).toBe(50);
    expect(impact.parameters.isDemoData).toBe(true);
  });

  test("keeps report activity separate from zone carbon totals", () => {
    const activity: VillageActivity[] = [
      {
        aiTriagedFieldReportCount: 48,
        demoAiTriagedFieldReportCount: 0,
        demoFieldReportCount: 0,
        fieldReportCount: 62,
        villageName: "Desa Contoh",
      },
    ];

    const dashboard = buildMrvDashboard(
      [demoZone],
      activity,
      { range: null },
      new Date("2026-11-15T00:00:00.000Z"),
    );

    expect(dashboard.totals.estimatedCarbonTons).toBe(7_340);
    expect(dashboard.villages[0]?.fieldReportCount).toBe(62);
    expect(dashboard.villages[0]?.estimatedCarbonTons).toBe(7_340);
    expect(dashboard.villages[0]?.readinessScore).toBeNull();
    expect(dashboard.readiness.status).toBe("unavailable");
    expect(dashboard.carbonTrend.status).toBe("unavailable");
  });

  test("marks dashboard data illustrative when only report rows are demos", () => {
    const activity: VillageActivity[] = [
      {
        aiTriagedFieldReportCount: 0,
        demoAiTriagedFieldReportCount: 1,
        demoFieldReportCount: 1,
        fieldReportCount: 0,
        villageName: "Desa Demo",
      },
    ];

    const dashboard = buildMrvDashboard(
      [],
      activity,
      { range: null },
      new Date("2026-11-15T00:00:00.000Z"),
    );

    expect(dashboard.totals.containsIllustrativeData).toBe(true);
    expect(dashboard.villages[0]?.isIllustrative).toBe(true);
    expect(dashboard.totals.estimatedCarbonTons).toBe(0);
  });

  test("returns zero totals for an empty approved-zone set", () => {
    const dashboard = buildMrvDashboard(
      [],
      [],
      { range: null },
      new Date("2026-11-15T00:00:00.000Z"),
    );

    expect(dashboard.totals).toEqual({
      approvedZoneCount: 0,
      containsIllustrativeData: false,
      estimatedCarbonTons: 0,
      estimatedIncentiveIdr: 0,
      protectedAreaHectares: 0,
    });
    expect(dashboard.zones).toEqual([]);
  });
});
