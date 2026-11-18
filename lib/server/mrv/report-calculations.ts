import {
  calculateZoneImpact,
  roundToTwoDecimals,
  summarizeZoneImpacts,
} from "@/lib/server/mrv/calculations";
import type {
  CarbonSnapshotZoneImpact,
  ExecutiveNarrativeDraft,
  ExecutiveNarrativeInput,
  MrvGeneratedNarrative,
  MrvGeneratedReport,
  MrvDocumentType,
  MrvReportFilters,
  MrvReportRequest,
} from "@/lib/server/mrv/contracts";
import type { MrvReportSource } from "@/lib/server/mrv/report-data";

const MINIMUM_NARRATIVE_REPORT_COUNT = 5;
const NUMBER_WORDS = [
  "nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas",
  "belasan|puluh|puluhan|seratus|ratus|ratusan|seribu|ribu|ribuan",
  "juta|jutaan|miliaran|milyaran|miliar|milyar|triliun|triliunan",
  "pertama|kedua|ketiga|setengah|separo|persen|persentase",
  "rp|rupiah|ton|tons|tonne|tonnes|hektare|hektar|hectare|hectares|idr|dolar|usd",
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen",
  "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|first|second|third|fourth|fifth",
  "dozen|dozens|hundred|hundreds|thousand|thousands|million|millions|billion|billions",
  "several|multiple|many|few|banyak|sedikit|most|majority|minority|mayoritas|minoritas",
  "terbanyak|terendah|half|pair|couple|single|double|triple|twice|once",
].join("|");
const QUANTITY_PHRASES = [
  "sebagian\\s+besar",
  "sebagian\\s+kecil",
  "lebih\\s+dari",
  "kurang\\s+dari",
  "lebih\\s+banyak",
  "lebih\\s+sedikit",
  "paling\\s+tinggi",
  "paling\\s+rendah",
  "di\\s+atas",
  "di\\s+bawah",
  "around",
  "approximately",
  "more\\s+than",
  "less\\s+than",
  "fewer\\s+than",
];
const UNSUPPORTED_TREND_WORDS =
  "meningkat|peningkatan|menurun|penurunan|bertambah|bertambahnya|berkurang|pengurangan|membaik|perbaikan|stabil|stabilisasi|kenaikan|dibandingkan|tren|trend|naik|turun|increase|increased|increasing|rise|rose|rising|decrease|decreased|decreasing|higher|lower|more|less|fall|fell|falling|improve|improved|improving|stable|stabilize";
const UNSUPPORTED_CLAIM_PATTERN = new RegExp(
  "\\p{N}|\\b(?:" +
    NUMBER_WORDS +
    "|" +
    UNSUPPORTED_TREND_WORDS +
    ")\\b|\\b(?:" +
    QUANTITY_PHRASES.join("|") +
    ")\\b",
  "iu",
);

export type NarrativeProvider = (
  input: ExecutiveNarrativeInput,
) => Promise<ExecutiveNarrativeDraft>;

function containsNumericClaim(value: string): boolean {
  return UNSUPPORTED_CLAIM_PATTERN.test(value) || /[%$€¥]/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isNarrativeDraft(value: unknown): value is ExecutiveNarrativeDraft {
  if (!isRecord(value)) {
    return false;
  }

  if (
    Object.keys(value).length !== 3 ||
    typeof value.headline !== "string" ||
    typeof value.narrative !== "string" ||
    !isStringList(value.recommendations)
  ) {
    return false;
  }

  if (
    value.headline.trim().length === 0 ||
    value.headline.length > 120 ||
    value.narrative.trim().length === 0 ||
    value.narrative.length > 800 ||
    value.recommendations.length < 1 ||
    value.recommendations.length > 3
  ) {
    return false;
  }

  const strings = [value.headline, value.narrative, ...value.recommendations];

  return (
    strings.every(
      (text) => text.trim().length > 0 && !containsNumericClaim(text),
    ) &&
    value.recommendations.every(
      (recommendation) => recommendation.length <= 200,
    )
  );
}

function sumZoneImpact(impacts: ReturnType<typeof calculateZoneImpact>[]) {
  const totals = summarizeZoneImpacts(impacts);
  return {
    areaHectares: totals.protectedAreaHectares,
    carbonTons: totals.estimatedCarbonTons,
    incentiveIdr: totals.estimatedIncentiveIdr,
  };
}

function createNarrativeMetrics(
  source: MrvReportSource,
  zoneImpacts: ReturnType<typeof calculateZoneImpact>[],
) {
  const observedZones = zoneImpacts.filter(
    (zone) => !zone.isDemoData && !zone.parameters.isDemoData,
  );
  const carbon = source.hasCarbonSnapshot ? sumZoneImpact(observedZones) : null;

  return {
    activeReportCount: source.reports.nonDemoActiveCount,
    aiTriagedReportCount: source.reports.nonDemoAiTriagedCount,
    averageResponseMinutes:
      source.reports.nonDemoResponseMinutes === null
        ? null
        : roundToTwoDecimals(source.reports.nonDemoResponseMinutes),
    closedReportCount: source.reports.nonDemoClosedCount,
    estimatedCarbonTons: carbon?.carbonTons ?? null,
    estimatedIncentiveIdr: carbon?.incentiveIdr ?? null,
    fieldReportCount: source.reports.nonDemoCount,
    reportsWithResponseTime: source.reports.nonDemoRespondedCount,
    satelliteHotspotCount: source.hotspots.historicalBoundaryUnavailable
      ? null
      : source.hotspots.nonDemoCount,
  };
}

async function createNarrative(
  request: MrvReportRequest,
  source: MrvReportSource,
  zoneImpacts: ReturnType<typeof calculateZoneImpact>[],
  provider: NarrativeProvider | undefined,
): Promise<MrvGeneratedNarrative> {
  if (!request.includeNarrative) {
    return { status: "not_requested" };
  }

  if (!request.aiConsent) {
    return { reason: "CONSENT_REQUIRED", status: "unavailable" };
  }

  if (source.reports.nonDemoCount < MINIMUM_NARRATIVE_REPORT_COUNT) {
    return { reason: "INSUFFICIENT_AGGREGATE_REPORTS", status: "unavailable" };
  }

  if (!provider) {
    return {
      reason: "NARRATIVE_PROVIDER_NOT_CONFIGURED",
      status: "unavailable",
    };
  }

  try {
    const draft = await provider({
      consent: true,
      metrics: createNarrativeMetrics(source, zoneImpacts),
    });

    if (!isNarrativeDraft(draft)) {
      return { reason: "NARRATIVE_PROVIDER_FAILED", status: "unavailable" };
    }

    return { ...draft, status: "generated" };
  } catch {
    return { reason: "NARRATIVE_PROVIDER_FAILED", status: "unavailable" };
  }
}

function buildGeneratedReport(
  source: MrvReportSource,
  filters: MrvReportFilters,
  documentType: MrvDocumentType,
  narrative: MrvGeneratedNarrative,
  generatedAt: Date,
): MrvGeneratedReport {
  const zoneImpacts: CarbonSnapshotZoneImpact[] = source.zones.map((zone) => ({
    ...calculateZoneImpact(zone),
    snapshotAt: zone.snapshotAt,
    snapshotReason: zone.snapshotReason,
  }));
  const carbon = source.hasCarbonSnapshot ? sumZoneImpact(zoneImpacts) : null;
  const generatedAtIso = generatedAt.toISOString();

  return {
    canalCondition: source.canalObservations?.length
      ? { status: "available", observations: source.canalObservations }
      : { reason: "CANAL_CONDITION_NOT_RECORDED", status: "unavailable" },
    partial: source.partial,
    containsIllustrativeData:
      source.reports.demoCount > 0 ||
      source.hotspots.demoCount > 0 ||
      zoneImpacts.some((zone) => zone.isIllustrative),
    documentType,
    generatedAt: generatedAtIso,
    narrative,
    metrics: {
      carbon: {
        asOf: source.hasCarbonSnapshot ? source.carbonSnapshotAsOf : null,
        approvedZoneCount: source.hasCarbonSnapshot ? zoneImpacts.length : null,
        containsIllustrativeData: zoneImpacts.some(
          (zone) => zone.isIllustrative,
        ),
        estimatedCarbonTons: carbon?.carbonTons ?? null,
        estimatedIncentiveIdr: carbon?.incentiveIdr ?? null,
        protectedAreaHectares: carbon?.areaHectares ?? null,
        reason: source.hasCarbonSnapshot
          ? null
          : "CARBON_SNAPSHOT_NOT_RECORDED",
        status: source.hasCarbonSnapshot ? "available" : "unavailable",
        excludedZoneCount: source.excludedZoneCount,
        periodChangeTons:
          carbon && source.priorCarbonTons != null
            ? roundToTwoDecimals(carbon.carbonTons - source.priorCarbonTons)
            : null,
        zones: zoneImpacts,
      },
      hotspots: {
        demoCount: source.hotspots.demoCount,
        nonDemoCount: source.hotspots.nonDemoCount,
        totalCount: source.hotspots.totalCount,
        ...(source.hotspots.historicalBoundaryUnavailable
          ? { historicalBoundaryUnavailable: true }
          : {}),
      },
      reports: {
        activeCount: source.reports.activeCount,
        aiTriagedCount: source.reports.aiTriagedCount,
        closedCount: source.reports.closedCount,
        evidence: {
          accepted: source.reports.acceptedEvidenceCount ?? 0,
          followUp: source.reports.followUpEvidenceCount ?? 0,
          rejected: source.reports.rejectedEvidenceCount ?? 0,
        },
        demoCount: source.reports.demoCount,
        nonDemoActiveCount: source.reports.nonDemoActiveCount,
        nonDemoAiTriagedCount: source.reports.nonDemoAiTriagedCount,
        nonDemoClosedCount: source.reports.nonDemoClosedCount,
        nonDemoCount: source.reports.nonDemoCount,
        totalCount: source.reports.totalCount,
      },
      responseTime: {
        averageMinutes:
          source.reports.responseMinutes === null
            ? null
            : roundToTwoDecimals(source.reports.responseMinutes),
        definition: "RECEIVED_TO_FIRST_IN_PROGRESS",
        nonDemoAverageMinutes:
          source.reports.nonDemoResponseMinutes === null
            ? null
            : roundToTwoDecimals(source.reports.nonDemoResponseMinutes),
        nonDemoRespondedReportCount: source.reports.nonDemoRespondedCount,
        respondedReportCount: source.reports.respondedCount,
        status: source.reports.respondedCount > 0 ? "available" : "unavailable",
      },
    },
    printable: {
      generatedAt: generatedAtIso,
      language: "id-ID",
      period: {
        from: filters.range?.fromDate ?? null,
        to: filters.range?.toDate ?? null,
      },
      sections:
        documentType === "CARBON_AUDIT"
          ? [
              { key: "carbon", title: "Estimasi pencegahan emisi karbon" },
              { key: "evidence", title: "Ringkasan bukti MRV" },
              { key: "narrative", title: "Draf narasi eksekutif" },
            ]
          : [
              { key: "hotspots", title: "Titik panas satelit" },
              {
                key: "field-reports",
                title: "Laporan lapangan dan penanganan",
              },
              { key: "response-time", title: "Waktu respons posko" },
              { key: "canal-condition", title: "Kondisi sekat kanal" },
              { key: "narrative", title: "Draf narasi eksekutif" },
            ],
      title:
        documentType === "CARBON_AUDIT"
          ? "Laporan Audit Karbon Bulanan PEATGUARD"
          : "Laporan Situasi Harian PEATGUARD",
    },
    scope: {
      from: filters.range?.fromDate ?? null,
      to: filters.range?.toDate ?? null,
      zoneId: filters.zoneId,
      zoneName: filters.zoneId
        ? (source.zoneName ?? source.zones[0]?.zoneName ?? null)
        : null,
    },
  };
}

export async function buildMrvGeneratedReport(
  request: MrvReportRequest,
  source: MrvReportSource,
  provider?: NarrativeProvider,
  generatedAt = new Date(),
): Promise<MrvGeneratedReport> {
  const zoneImpacts = source.zones.map(calculateZoneImpact);
  const narrative = await createNarrative(
    request,
    source,
    zoneImpacts,
    provider,
  );

  return buildGeneratedReport(
    source,
    request.filters,
    request.documentType,
    narrative,
    generatedAt,
  );
}
