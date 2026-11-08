import type { QueuedFieldReport } from "./types";
import { API_ROUTES } from "@/lib/routes";

const REPORT_CATEGORIES = [
  "API_AKTIF",
  "ASAP_GAMBUT",
  "SEKAT_KANAL_KERING",
  "AMAN_TERKENDALI",
] as const;
const REPORT_URGENCIES = ["KRITIS", "WASPADA", "RENDAH"] as const;
const HANDLING_STATUSES = [
  "MENUNGGU_TINDAKAN",
  "DALAM_PENANGANAN",
  "SELESAI",
] as const;
const AI_STATES = ["PENDING", "COMPLETED", "FAILED", "SKIPPED"] as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ServerReportCategory = (typeof REPORT_CATEGORIES)[number];
export type ServerReportUrgency = (typeof REPORT_URGENCIES)[number];
export type ServerHandlingStatus = (typeof HANDLING_STATUSES)[number];
export type ServerAiState = (typeof AI_STATES)[number];

export type ServerReportSummary = {
  id: string;
  zoneId: string | null;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
  syncedAt: string;
  handlingStatus: ServerHandlingStatus;
  aiState: ServerAiState;
  aiCategory: ServerReportCategory | null;
  aiUrgency: ServerReportUrgency | null;
  isDemoSample: boolean;
  hasPhoto: boolean;
  photoHref: string | null;
};

export type ServerReportStatusEvent = {
  id: string;
  previousStatus: ServerHandlingStatus | null;
  nextStatus: ServerHandlingStatus;
  note: string | null;
  createdAt: string;
};

export type ServerReportDetail = ServerReportSummary & {
  clientReportId: string;
  fieldNotes: string | null;
  tags: string[];
  aiConsent: boolean;
  aiConfidence: number | null;
  aiSummary: string | null;
  aiVisualIndicators: string[] | null;
  aiFalsePositiveCheck: string | null;
  aiActionRecommendations: string[] | null;
  aiAnalyzedAt: string | null;
  nearestWaterDistanceM: number | null;
  createdAt: string;
  updatedAt: string;
  statusEvents: ServerReportStatusEvent[];
};

export type ServerReportPage = {
  reports: ServerReportSummary[];
  page: number;
  pageSize: number;
  total: number;
};

export class ReportReadError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "ReportReadError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalidResponse(): never {
  throw new ReportReadError("Respons laporan dari server tidak valid.");
}

function requiredString(value: unknown): string {
  if (typeof value !== "string") return invalidResponse();
  return value;
}

function reportUuid(value: unknown): string {
  const uuid = requiredString(value);
  if (!UUID_PATTERN.test(uuid)) return invalidResponse();
  return uuid;
}

function nullableString(value: unknown): string | null {
  if (value === null) return null;
  return requiredString(value);
}

function requiredBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") return invalidResponse();
  return value;
}

function finiteNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return invalidResponse();
  }
  return value;
}

function nullableNumber(value: unknown): number | null {
  if (value === null) return null;
  return finiteNumber(value);
}

function isoTimestamp(value: unknown): string {
  const timestamp = requiredString(value);
  if (!Number.isFinite(Date.parse(timestamp))) return invalidResponse();
  return timestamp;
}

function nullableTimestamp(value: unknown): string | null {
  if (value === null) return null;
  return isoTimestamp(value);
}

function enumValue<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] {
  if (typeof value !== "string") return invalidResponse();
  const match = allowed.find((item) => item === value);
  if (!match) return invalidResponse();
  return match;
}

function nullableEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | null {
  if (value === null) return null;
  return enumValue(value, allowed);
}

function stringArray(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    return invalidResponse();
  }
  return value;
}

function nullableStringArray(value: unknown): string[] | null {
  if (value === null) return null;
  return stringArray(value);
}

function reportPhotoHref(reportId: string, value: unknown): string | null {
  const href = nullableString(value);
  if (href !== null && href !== API_ROUTES.reports.photo(reportId)) {
    return invalidResponse();
  }
  return href;
}

function parseReportSummary(value: unknown): ServerReportSummary {
  if (!isRecord(value)) return invalidResponse();
  const id = reportUuid(value.id);
  const hasPhoto = requiredBoolean(value.hasPhoto);
  const photoHref = reportPhotoHref(id, value.photoHref);
  const zoneId = nullableString(value.zoneId);
  const latitude = finiteNumber(value.latitude);
  const longitude = finiteNumber(value.longitude);
  const accuracyMeters = nullableNumber(value.accuracyMeters);
  if (
    (zoneId !== null && !UUID_PATTERN.test(zoneId)) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (accuracyMeters !== null &&
      (accuracyMeters < 0 || accuracyMeters > 100_000))
  ) {
    return invalidResponse();
  }
  if (hasPhoto !== (photoHref !== null)) return invalidResponse();

  return {
    id,
    zoneId,
    latitude,
    longitude,
    accuracyMeters,
    capturedAt: isoTimestamp(value.capturedAt),
    syncedAt: isoTimestamp(value.syncedAt),
    handlingStatus: enumValue(value.handlingStatus, HANDLING_STATUSES),
    aiState: enumValue(value.aiState, AI_STATES),
    aiCategory: nullableEnum(value.aiCategory, REPORT_CATEGORIES),
    aiUrgency: nullableEnum(value.aiUrgency, REPORT_URGENCIES),
    isDemoSample: requiredBoolean(value.isDemoSample),
    hasPhoto,
    photoHref,
  };
}

export function parseServerReportPage(value: unknown): ServerReportPage {
  if (!isRecord(value) || !Array.isArray(value.reports))
    return invalidResponse();
  const page = finiteNumber(value.page);
  const pageSize = finiteNumber(value.pageSize);
  const total = finiteNumber(value.total);
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    !Number.isSafeInteger(total) ||
    total < 0 ||
    value.reports.length > pageSize
  ) {
    return invalidResponse();
  }

  return {
    reports: value.reports.map(parseReportSummary),
    page,
    pageSize,
    total,
  };
}

function parseStatusEvent(value: unknown): ServerReportStatusEvent {
  if (!isRecord(value)) return invalidResponse();
  return {
    id: requiredString(value.id),
    previousStatus: nullableEnum(value.previousStatus, HANDLING_STATUSES),
    nextStatus: enumValue(value.nextStatus, HANDLING_STATUSES),
    note: nullableString(value.note),
    createdAt: isoTimestamp(value.createdAt),
  };
}

export function parseServerReportDetail(value: unknown): ServerReportDetail {
  if (!isRecord(value)) return invalidResponse();
  const summary = parseReportSummary(value);
  const statusEventsValue = value.statusEvents;
  if (!Array.isArray(statusEventsValue)) return invalidResponse();
  const aiConfidence = nullableNumber(value.aiConfidence);
  const nearestWaterDistanceM = nullableNumber(value.nearestWaterDistanceM);
  if (
    (aiConfidence !== null && (aiConfidence < 0 || aiConfidence > 1)) ||
    (nearestWaterDistanceM !== null && nearestWaterDistanceM < 0)
  ) {
    return invalidResponse();
  }

  return {
    ...summary,
    clientReportId: reportUuid(value.clientReportId),
    fieldNotes: nullableString(value.fieldNotes),
    tags: stringArray(value.tags),
    aiConsent: requiredBoolean(value.aiConsent),
    aiConfidence,
    aiSummary: nullableString(value.aiSummary),
    aiVisualIndicators: nullableStringArray(value.aiVisualIndicators),
    aiFalsePositiveCheck: nullableString(value.aiFalsePositiveCheck),
    aiActionRecommendations: nullableStringArray(value.aiActionRecommendations),
    aiAnalyzedAt: nullableTimestamp(value.aiAnalyzedAt),
    nearestWaterDistanceM,
    createdAt: isoTimestamp(value.createdAt),
    updatedAt: isoTimestamp(value.updatedAt),
    statusEvents: statusEventsValue.map(parseStatusEvent),
  };
}

export function shouldFetchServerReports(input: {
  ownerId: string | null;
  ownerStatus: string;
  isConnected: boolean;
}): boolean {
  return Boolean(
    input.ownerId && input.ownerStatus === "authenticated" && input.isConnected,
  );
}

export function splitReportHistory<
  T extends Pick<QueuedFieldReport, "syncState" | "serverReportId">,
>(
  serverReports: readonly ServerReportSummary[],
  localReports: readonly T[],
): {
  outboxReports: T[];
  localSentFallback: T[];
} {
  const serverIds = new Set(serverReports.map((report) => report.id));
  return {
    outboxReports: localReports.filter(
      (report) => report.syncState !== "synced",
    ),
    localSentFallback: localReports.filter(
      (report) =>
        report.syncState === "synced" &&
        (!report.serverReportId || !serverIds.has(report.serverReportId)),
    ),
  };
}

export function findLocalReportForServer<
  T extends Pick<QueuedFieldReport, "syncState" | "serverReportId">,
>(serverReportId: string, localReports: readonly T[]): T | null {
  return (
    localReports.find(
      (report) =>
        report.syncState === "synced" &&
        report.serverReportId === serverReportId,
    ) ?? null
  );
}

export function resolveReportDetailSource<T>(input: {
  isConnected: boolean;
  serverReport: ServerReportDetail | null;
  localReport: T | null;
}):
  | { kind: "server"; report: ServerReportDetail }
  | { kind: "local"; report: T }
  | { kind: "unavailable" } {
  if (input.isConnected && input.serverReport) {
    return { kind: "server", report: input.serverReport };
  }
  if (input.localReport) return { kind: "local", report: input.localReport };
  return { kind: "unavailable" };
}

export async function fetchServerReportPage(
  signal?: AbortSignal,
  page = 1,
): Promise<ServerReportPage> {
  const query = new URLSearchParams({ page: String(page), pageSize: "25" });
  let response: Response;
  try {
    response = await fetch(`${API_ROUTES.reports.root}?${query.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ReportReadError(
      "Riwayat server tidak dapat dijangkau. Periksa koneksi internet.",
    );
  }
  if (!response.ok) {
    throw new ReportReadError(
      response.status === 401 || response.status === 403
        ? "Sesi relawan perlu diperiksa sebelum membuka laporan server."
        : response.status === 503
          ? "Riwayat server sedang tidak tersedia. Laporan lokal tetap aman."
          : "Riwayat laporan server belum dapat dibuka.",
      response.status,
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  return parseServerReportPage(payload);
}

export async function fetchServerReportDetail(
  reportId: string,
  signal?: AbortSignal,
): Promise<ServerReportDetail> {
  let response: Response;
  try {
    response = await fetch(API_ROUTES.reports.detail(reportId), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ReportReadError(
      "Detail server tidak dapat dijangkau. Periksa koneksi internet.",
    );
  }
  if (!response.ok) {
    throw new ReportReadError(
      response.status === 401 || response.status === 403
        ? "Sesi relawan perlu diperiksa sebelum membuka laporan server."
        : response.status === 404
          ? "Laporan server tidak ditemukan atau tidak dapat diakses."
          : "Detail laporan server belum dapat dibuka.",
      response.status,
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isRecord(payload) || !("report" in payload)) return invalidResponse();
  return parseServerReportDetail(payload.report);
}
