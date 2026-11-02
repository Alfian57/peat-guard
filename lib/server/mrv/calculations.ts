import type {
  ApprovedZoneValues,
  DashboardFilters,
  DashboardVillage,
  MrvDashboard,
  VillageActivity,
  ZoneImpact,
} from "@/lib/server/mrv/contracts";

export function roundToTwoDecimals(value: number): number {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function calculateZoneImpact(zone: ApprovedZoneValues): ZoneImpact {
  const rawCarbonTons =
    zone.areaHectares *
    zone.biomassFactor *
    zone.emissionFactor *
    zone.co2ConversionFactor;

  return {
    areaHectares: zone.areaHectares,
    calculationVersion: "peatguard-mrv-v1",
    estimatedCarbonTons: roundToTwoDecimals(rawCarbonTons),
    estimatedIncentiveIdr: roundToTwoDecimals(
      rawCarbonTons * zone.incentivePerTonIdr,
    ),
    isDemoData: zone.isDemoData,
    isIllustrative: zone.isDemoData || zone.parameterIsDemoData,
    parameters: {
      biomassFactorTonsCarbonPerHectare: zone.biomassFactor,
      co2ConversionFactor: zone.co2ConversionFactor,
      emissionFactor: zone.emissionFactor,
      incentivePerTonIdr: zone.incentivePerTonIdr,
      isDemoData: zone.parameterIsDemoData,
      name: zone.name,
      parameterSetId: zone.parameterSetId,
    },
    villageName: zone.villageName,
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
  };
}

type VillageBuilder = {
  aiTriagedFieldReportCount: number;
  demoAiTriagedFieldReportCount: number;
  demoFieldReportCount: number;
  estimatedCarbonTons: number;
  estimatedIncentiveIdr: number;
  fieldReportCount: number;
  isIllustrative: boolean;
  readinessScore: null;
  villageName: string;
  zoneCount: number;
};

function ensureVillage(
  villages: Map<string, VillageBuilder>,
  name: string | null,
): VillageBuilder {
  const villageName = name?.trim() || "Tidak diketahui";
  const existing = villages.get(villageName);

  if (existing) {
    return existing;
  }

  const created: VillageBuilder = {
    aiTriagedFieldReportCount: 0,
    demoAiTriagedFieldReportCount: 0,
    demoFieldReportCount: 0,
    estimatedCarbonTons: 0,
    estimatedIncentiveIdr: 0,
    fieldReportCount: 0,
    isIllustrative: false,
    readinessScore: null,
    villageName,
    zoneCount: 0,
  };

  villages.set(villageName, created);
  return created;
}

export function buildMrvDashboard(
  zoneRows: ApprovedZoneValues[],
  activities: VillageActivity[],
  filters: DashboardFilters,
  asOf: Date,
): MrvDashboard {
  const zones = zoneRows.map(calculateZoneImpact);
  const villages = new Map<string, VillageBuilder>();

  for (const zone of zones) {
    const village = ensureVillage(villages, zone.villageName);
    village.zoneCount += 1;
    village.estimatedCarbonTons = roundToTwoDecimals(
      village.estimatedCarbonTons + zone.estimatedCarbonTons,
    );
    village.estimatedIncentiveIdr = roundToTwoDecimals(
      village.estimatedIncentiveIdr + zone.estimatedIncentiveIdr,
    );
    village.isIllustrative ||= zone.isIllustrative;
  }

  for (const activity of activities) {
    const village = ensureVillage(villages, activity.villageName);
    village.fieldReportCount += activity.fieldReportCount;
    village.demoFieldReportCount += activity.demoFieldReportCount;
    village.aiTriagedFieldReportCount += activity.aiTriagedFieldReportCount;
    village.demoAiTriagedFieldReportCount +=
      activity.demoAiTriagedFieldReportCount;
    village.isIllustrative ||=
      activity.demoFieldReportCount > 0 ||
      activity.demoAiTriagedFieldReportCount > 0;
  }

  const zoneTotals = zones.reduce(
    (totals, zone) => ({
      estimatedCarbonTons: roundToTwoDecimals(
        totals.estimatedCarbonTons + zone.estimatedCarbonTons,
      ),
      estimatedIncentiveIdr: roundToTwoDecimals(
        totals.estimatedIncentiveIdr + zone.estimatedIncentiveIdr,
      ),
      protectedAreaHectares: roundToTwoDecimals(
        totals.protectedAreaHectares + zone.areaHectares,
      ),
    }),
    {
      estimatedCarbonTons: 0,
      estimatedIncentiveIdr: 0,
      protectedAreaHectares: 0,
    },
  );

  return {
    activityPeriod: {
      from: filters.range?.fromDate ?? null,
      to: filters.range?.toDate ?? null,
    },
    asOf: asOf.toISOString(),
    calculation: {
      formula: "E_saved = A × B × EF × conversion",
      version: "peatguard-mrv-v1",
    },
    carbonTrend: {
      reason: "MONTHLY_ZONE_HISTORY_NOT_RECORDED",
      status: "unavailable",
    },
    readiness: {
      reason: "READINESS_SCORE_FORMULA_NOT_DEFINED",
      status: "unavailable",
    },
    totals: {
      approvedZoneCount: zones.length,
      containsIllustrativeData:
        zones.some((zone) => zone.isIllustrative) ||
        activities.some(
          (activity) =>
            activity.demoFieldReportCount > 0 ||
            activity.demoAiTriagedFieldReportCount > 0,
        ),
      ...zoneTotals,
    },
    villages: [...villages.values()].sort((left, right) =>
      left.villageName.localeCompare(right.villageName, "id"),
    ) satisfies DashboardVillage[],
    zones,
  };
}
