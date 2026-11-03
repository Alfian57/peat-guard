import {
  AIAnalysisState,
  HandlingStatus,
  ReportCategory,
  ReportUrgency,
  type AIAnalysisState as AIAnalysisStateValue,
  type HandlingStatus as HandlingStatusValue,
  type ReportCategory as ReportCategoryValue,
  type ReportUrgency as ReportUrgencyValue,
} from "@/app/generated/prisma/enums";
import { isRecord } from "@/components/command/command-api";

export const REPORT_STATUSES = [
  HandlingStatus.MENUNGGU_TINDAKAN,
  HandlingStatus.DALAM_PENANGANAN,
  HandlingStatus.SELESAI,
] as const;

export type ReportStatus = HandlingStatusValue;

export type ReportListItem = {
  id: string;
  zoneId: string | null;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
  syncedAt: string;
  handlingStatus: HandlingStatusValue;
  aiState: AIAnalysisStateValue | null;
  aiCategory: ReportCategoryValue | null;
  aiUrgency: ReportUrgencyValue | null;
  isDemoSample: boolean;
  hasPhoto: boolean;
  photoHref: string | null;
};

export type ReportListResponse = {
  reports: ReportListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type ReportMapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
  aiUrgency: ReportUrgencyValue | null;
  aiCategory: ReportCategoryValue | null;
  handlingStatus: HandlingStatusValue;
  isDemoSample: boolean;
};

export type ReportMapPointsResponse = {
  points: ReportMapPoint[];
  truncated: boolean;
  limit: number;
};

export type ReportStatusEvent = {
  id: string;
  previousStatus: HandlingStatusValue | null;
  nextStatus: HandlingStatusValue;
  note: string | null;
  createdAt: string;
};

export type ReportDetail = {
  id: string;
  clientReportId: string;
  zoneId: string | null;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  fieldNotes: string | null;
  tags: string[];
  capturedAt: string;
  syncedAt: string;
  aiConsent: boolean;
  aiState: AIAnalysisStateValue | null;
  aiCategory: ReportCategoryValue | null;
  aiUrgency: ReportUrgencyValue | null;
  aiConfidence: number | null;
  aiSummary: string | null;
  aiVisualIndicators: string[] | null;
  aiFalsePositiveCheck: string | null;
  aiActionRecommendations: string[] | null;
  aiAnalyzedAt: string | null;
  handlingStatus: HandlingStatusValue;
  nearestWaterDistanceM: number | null;
  isDemoSample: boolean;
  createdAt: string;
  updatedAt: string;
  photoHref: string;
  statusEvents: ReportStatusEvent[];
};

export function isReportStatus(value: unknown): value is ReportStatus {
  return isEnumValue(value, Object.values(HandlingStatus));
}

export function isReportListResponse(
  value: unknown,
): value is ReportListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.reports) &&
    value.reports.every(isReportListItem) &&
    isPositiveInteger(value.page) &&
    isPositiveInteger(value.pageSize) &&
    isNonNegativeInteger(value.total)
  );
}

export function isReportMapPointsResponse(
  value: unknown,
): value is ReportMapPointsResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.points) &&
    value.points.every(isReportMapPoint) &&
    typeof value.truncated === "boolean" &&
    isPositiveInteger(value.limit)
  );
}

export function isReportDetailResponse(
  value: unknown,
): value is { report: ReportDetail } {
  return isRecord(value) && isReportDetail(value.report);
}

export function isReportStatusResponse(
  value: unknown,
): value is { id: string; status: ReportStatus } {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isReportStatus(value.status)
  );
}

function isReportListItem(value: unknown): value is ReportListItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isNullableString(value.zoneId) &&
    typeof value.latitude === "number" &&
    typeof value.longitude === "number" &&
    isNullableNumber(value.accuracyMeters) &&
    typeof value.capturedAt === "string" &&
    typeof value.syncedAt === "string" &&
    isReportStatus(value.handlingStatus) &&
    isNullableEnum(value.aiState, Object.values(AIAnalysisState)) &&
    isNullableEnum(value.aiCategory, Object.values(ReportCategory)) &&
    isNullableEnum(value.aiUrgency, Object.values(ReportUrgency)) &&
    typeof value.isDemoSample === "boolean" &&
    typeof value.hasPhoto === "boolean" &&
    isNullableString(value.photoHref)
  );
}

function isReportMapPoint(value: unknown): value is ReportMapPoint {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180 &&
    typeof value.capturedAt === "string" &&
    isNullableEnum(value.aiUrgency, Object.values(ReportUrgency)) &&
    isNullableEnum(value.aiCategory, Object.values(ReportCategory)) &&
    isReportStatus(value.handlingStatus) &&
    typeof value.isDemoSample === "boolean"
  );
}

function isReportDetail(value: unknown): value is ReportDetail {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.clientReportId === "string" &&
    isNullableString(value.zoneId) &&
    typeof value.latitude === "number" &&
    typeof value.longitude === "number" &&
    isNullableNumber(value.accuracyMeters) &&
    isNullableString(value.fieldNotes) &&
    isStringArray(value.tags) &&
    typeof value.capturedAt === "string" &&
    typeof value.syncedAt === "string" &&
    typeof value.aiConsent === "boolean" &&
    isNullableEnum(value.aiState, Object.values(AIAnalysisState)) &&
    isNullableEnum(value.aiCategory, Object.values(ReportCategory)) &&
    isNullableEnum(value.aiUrgency, Object.values(ReportUrgency)) &&
    isNullableNumber(value.aiConfidence) &&
    isNullableString(value.aiSummary) &&
    isNullableStringArray(value.aiVisualIndicators) &&
    isNullableString(value.aiFalsePositiveCheck) &&
    isNullableStringArray(value.aiActionRecommendations) &&
    isNullableString(value.aiAnalyzedAt) &&
    isReportStatus(value.handlingStatus) &&
    isNullableNumber(value.nearestWaterDistanceM) &&
    typeof value.isDemoSample === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.photoHref === "string" &&
    Array.isArray(value.statusEvents) &&
    value.statusEvents.every(isReportStatusEvent)
  );
}

function isReportStatusEvent(value: unknown): value is ReportStatusEvent {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.previousStatus === null || isReportStatus(value.previousStatus)) &&
    isReportStatus(value.nextStatus) &&
    isNullableString(value.note) &&
    typeof value.createdAt === "string"
  );
}

function isEnumValue<T extends string>(
  value: unknown,
  choices: readonly T[],
): value is T {
  return (
    typeof value === "string" && choices.some((choice) => choice === value)
  );
}

function isNullableEnum<T extends string>(
  value: unknown,
  choices: readonly T[],
): value is T | null {
  return value === null || isEnumValue(value, choices);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isNullableStringArray(value: unknown): value is string[] | null {
  return value === null || isStringArray(value);
}
