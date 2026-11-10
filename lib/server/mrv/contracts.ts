export type DateRange = {
  from: Date | null;
  fromDate: string | null;
  toDate: string | null;
  toExclusive: Date | null;
};

export type DashboardFilters = {
  range: DateRange | null;
};

export type MrvReportFilters = {
  range: DateRange | null;
  zoneId: string | null;
};

export type MrvDocumentType = "SITUATION" | "CARBON_AUDIT";

export type MrvReportRequest = {
  aiConsent: boolean;
  documentType: MrvDocumentType;
  filters: MrvReportFilters;
  includeNarrative: boolean;
};

export type ExecutiveNarrativeMetrics = {
  activeReportCount: number;
  aiTriagedReportCount: number;
  averageResponseMinutes: number | null;
  closedReportCount: number;
  estimatedCarbonTons: number | null;
  estimatedIncentiveIdr: number | null;
  fieldReportCount: number;
  reportsWithResponseTime: number;
  satelliteHotspotCount: number;
};

export type ExecutiveNarrativeInput = {
  consent: true;
  metrics: ExecutiveNarrativeMetrics;
};

export type ExecutiveNarrativeDraft = {
  headline: string;
  narrative: string;
  recommendations: string[];
};

export type ExecutiveNarrativeProvider = (
  input: ExecutiveNarrativeInput,
) => Promise<ExecutiveNarrativeDraft>;

export type MrvGeneratedNarrative =
  | { status: "not_requested" }
  | {
      reason:
        | "CONSENT_REQUIRED"
        | "INSUFFICIENT_AGGREGATE_REPORTS"
        | "NARRATIVE_PROVIDER_FAILED"
        | "NARRATIVE_PROVIDER_NOT_CONFIGURED";
      status: "unavailable";
    }
  | ({ status: "generated" } & ExecutiveNarrativeDraft);

export type MrvGeneratedReport = {
  canalCondition: {
    reason: "CANAL_CONDITION_NOT_RECORDED";
    status: "unavailable";
  };
  containsIllustrativeData: boolean;
  documentType: MrvDocumentType;
  generatedAt: string;
  narrative: MrvGeneratedNarrative;
  metrics: {
    carbon: {
      asOf: string | null;
      approvedZoneCount: number | null;
      containsIllustrativeData: boolean;
      estimatedCarbonTons: number | null;
      estimatedIncentiveIdr: number | null;
      protectedAreaHectares: number | null;
      reason: "CARBON_SNAPSHOT_NOT_RECORDED" | null;
      status: "available" | "unavailable";
      zones: CarbonSnapshotZoneImpact[];
    };
    hotspots: {
      demoCount: number;
      nonDemoCount: number;
      totalCount: number;
    };
    reports: {
      activeCount: number;
      aiTriagedCount: number;
      demoCount: number;
      nonDemoActiveCount: number;
      nonDemoAiTriagedCount: number;
      nonDemoClosedCount: number;
      nonDemoCount: number;
      totalCount: number;
      closedCount: number;
    };
    responseTime: {
      averageMinutes: number | null;
      definition: "RECEIVED_TO_FIRST_IN_PROGRESS";
      nonDemoAverageMinutes: number | null;
      nonDemoRespondedReportCount: number;
      respondedReportCount: number;
      status: "available" | "unavailable";
    };
  };
  printable: {
    generatedAt: string;
    language: "id-ID";
    period: { from: string | null; to: string | null };
    sections: Array<{
      key:
        | "carbon"
        | "canal-condition"
        | "field-reports"
        | "hotspots"
        | "narrative"
        | "response-time";
      title: string;
    }>;
    title: string;
  };
  scope: {
    from: string | null;
    to: string | null;
    zoneId: string | null;
    zoneName: string | null;
  };
};

export type LedgerFilters = {
  aiState: "COMPLETED" | "FAILED" | "PENDING" | "SKIPPED" | null;
  evidence: "all" | "complete";
  page: number;
  pageSize: number;
  reportId: string | null;
  range: DateRange | null;
  zoneId: string | null;
};

export type LedgerExportFilters = Omit<LedgerFilters, "page" | "pageSize"> & {
  format: "csv" | "json";
};

export type ValidationResult<T> =
  { ok: true; value: T } | { error: string; ok: false };

export type CarbonParameterValues = {
  co2ConversionFactor: number;
  emissionFactor: number;
  incentivePerTonIdr: number;
  name: string;
  parameterSetId: string;
  biomassFactor: number;
  parameterIsDemoData: boolean;
};

export type ApprovedZoneValues = CarbonParameterValues & {
  areaHectares: number;
  isDemoData: boolean;
  villageName: string | null;
  zoneId: string;
  zoneName: string;
};

export type CarbonSnapshotReason =
  | "INITIAL_BASELINE"
  | "PARAMETER_SET_CREATED"
  | "PARAMETER_SET_UPDATED"
  | "ZONE_CREATED"
  | "ZONE_UPDATED";

export type CarbonSnapshotZoneValues = ApprovedZoneValues & {
  snapshotAt: string;
  snapshotReason: CarbonSnapshotReason;
};

export type ZoneImpact = {
  areaHectares: number;
  calculationVersion: "peatguard-mrv-v1";
  estimatedCarbonTons: number;
  estimatedIncentiveIdr: number;
  isDemoData: boolean;
  isIllustrative: boolean;
  parameters: {
    biomassFactorTonsCarbonPerHectare: number;
    co2ConversionFactor: number;
    emissionFactor: number;
    incentivePerTonIdr: number;
    name: string;
    isDemoData: boolean;
    parameterSetId: string;
  };
  villageName: string | null;
  zoneId: string;
  zoneName: string;
};

export type CarbonSnapshotZoneImpact = ZoneImpact & {
  snapshotAt: string;
  snapshotReason: CarbonSnapshotReason;
};

export type VillageActivity = {
  aiTriagedFieldReportCount: number;
  demoAiTriagedFieldReportCount: number;
  demoFieldReportCount: number;
  fieldReportCount: number;
  villageName: string;
};

export type DashboardVillage = {
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

export type MrvDashboard = {
  activityPeriod: { from: string | null; to: string | null };
  asOf: string;
  calculation: {
    formula: "E_saved = A × B × EF × conversion";
    version: "peatguard-mrv-v1";
  };
  carbonTrend: {
    reason: "MONTHLY_ZONE_HISTORY_NOT_RECORDED";
    status: "unavailable";
  };
  readiness: {
    reason: "READINESS_SCORE_FORMULA_NOT_DEFINED";
    status: "unavailable";
  };
  totals: {
    approvedZoneCount: number;
    containsIllustrativeData: boolean;
    estimatedCarbonTons: number;
    estimatedIncentiveIdr: number;
    protectedAreaHectares: number;
  };
  villages: DashboardVillage[];
  zones: ZoneImpact[];
};

export type LedgerStatusEvent = {
  actorRole: string;
  createdAt: string;
  eventId: string;
  nextStatus: string;
  previousStatus: string | null;
};

export type EvidenceReviewDecision =
  "ACCEPTED" | "NEEDS_FOLLOW_UP" | "REJECTED";

export type MrvEvidenceSnapshot = {
  accuracyMeters: number | null;
  aiCategory: string | null;
  aiConfidence: number | null;
  aiState: string | null;
  aiUrgency: string | null;
  capturedAt: string;
  latitude: number;
  longitude: number;
  photoPresent: boolean;
  photoSha256: string | null;
  syncedAt: string;
};

export type MrvLedgerAuditEntry = {
  actorRole: string | null;
  classification: {
    category: string | null;
    confidence: number | null;
    state: string;
    urgency: string | null;
  } | null;
  createdAt: string;
  decision: EvidenceReviewDecision | null;
  eventId: string;
  eventType:
    | "MRV_EVIDENCE_REVIEWED"
    | "REPORT_AI_ANALYSIS_COMPLETED"
    | "REPORT_AI_ANALYSIS_FAILED"
    | "REPORT_EVIDENCE_RECORDED";
  evidenceSnapshot: MrvEvidenceSnapshot | null;
  source: "field_sync" | null;
};

export type MrvLedgerRow = {
  aiTriage: {
    category: string | null;
    confidence: number | null;
    state: string | null;
    urgency: string | null;
  };
  coordinates: {
    accuracyMeters: number | null;
    latitude: number;
    longitude: number;
    status: "recorded_not_verified";
  };
  createdAt: string;
  capturedAt: string;
  evidenceStatus: "complete" | "incomplete";
  auditHistory: MrvLedgerAuditEntry[];
  hasPhoto: boolean;
  handlingStatus: string;
  isDemoSample: boolean;
  photoHref: string | null;
  reportId: string;
  statusHistory: LedgerStatusEvent[];
  syncedAt: string;
  villageName: string | null;
  zoneImpactContext:
    | (ZoneImpact & {
        attribution: "current_zone_context_not_patrol_contribution";
      })
    | null;
};

export type MrvLedger = {
  filters: {
    aiState: LedgerFilters["aiState"];
    evidence: LedgerFilters["evidence"];
    from: string | null;
    reportId: string | null;
    to: string | null;
    zoneId: string | null;
  };
  page: number;
  pageSize: number;
  rows: MrvLedgerRow[];
  total: number;
};
