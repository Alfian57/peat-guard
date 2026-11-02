import type {
  DashboardFilters,
  DateRange,
  LedgerExportFilters,
  LedgerFilters,
  MrvReportRequest,
  ValidationResult,
} from "@/lib/server/mrv/contracts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const AI_STATES = ["COMPLETED", "FAILED", "PENDING", "SKIPPED"] as const;
type AiState = (typeof AI_STATES)[number];

type QueryValue = ValidationResult<string | null>;

function getSingleValue(
  searchParams: URLSearchParams,
  key: string,
): QueryValue {
  const values = searchParams.getAll(key);

  if (values.length > 1) {
    return { error: `Parameter ${key} must appear only once.`, ok: false };
  }

  return { ok: true, value: values[0] ?? null };
}

function parseCalendarDate(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const utcCheck = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(utcCheck.getTime()) ||
    utcCheck.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return new Date(`${value}T00:00:00.000+07:00`);
}

function nextCalendarDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function parseDateRange(
  searchParams: URLSearchParams,
): ValidationResult<DateRange | null> {
  const fromValue = getSingleValue(searchParams, "from");
  const toValue = getSingleValue(searchParams, "to");

  if (!fromValue.ok) {
    return fromValue;
  }

  if (!toValue.ok) {
    return toValue;
  }

  if (fromValue.value === null && toValue.value === null) {
    return { ok: true, value: null };
  }

  if (fromValue.value === null || toValue.value === null) {
    return {
      error: "Parameters from and to must be provided together.",
      ok: false,
    };
  }

  const from = parseCalendarDate(fromValue.value);
  const to = parseCalendarDate(toValue.value);

  if (!from || !to) {
    return {
      error: "Dates must be valid calendar dates in YYYY-MM-DD format.",
      ok: false,
    };
  }

  if (from.getTime() > to.getTime()) {
    return { error: "The from date must not be after the to date.", ok: false };
  }

  const toExclusiveDate = nextCalendarDate(toValue.value);
  const toExclusive = new Date(`${toExclusiveDate}T00:00:00.000+07:00`);

  return {
    ok: true,
    value: {
      from,
      fromDate: fromValue.value,
      toDate: toValue.value,
      toExclusive,
    },
  };
}

function parseOptionalUuid(
  searchParams: URLSearchParams,
  key: string,
): ValidationResult<string | null> {
  const value = getSingleValue(searchParams, key);

  if (!value.ok) {
    return value;
  }

  if (value.value === null) {
    return { ok: true, value: null };
  }

  if (!UUID_PATTERN.test(value.value)) {
    return { error: `Parameter ${key} must be a UUID.`, ok: false };
  }

  return { ok: true, value: value.value.toLowerCase() };
}

function parsePositiveInteger(
  searchParams: URLSearchParams,
  key: string,
  fallback: number,
  max: number,
): ValidationResult<number> {
  const raw = getSingleValue(searchParams, key);

  if (!raw.ok) {
    return raw;
  }

  if (raw.value === null) {
    return { ok: true, value: fallback };
  }

  if (!/^\d+$/.test(raw.value)) {
    return { error: `Parameter ${key} must be a positive integer.`, ok: false };
  }

  const value = Number(raw.value);

  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    return {
      error: `Parameter ${key} must be between 1 and ${max}.`,
      ok: false,
    };
  }

  return { ok: true, value };
}

function isAiState(value: string): value is AiState {
  return AI_STATES.some((state) => state === value);
}

function parseSharedFilters(searchParams: URLSearchParams): ValidationResult<{
  aiState: LedgerFilters["aiState"];
  evidence: LedgerFilters["evidence"];
  range: DateRange | null;
  zoneId: string | null;
}> {
  const range = parseDateRange(searchParams);
  const zoneId = parseOptionalUuid(searchParams, "zoneId");
  const aiState = getSingleValue(searchParams, "aiState");
  const evidence = getSingleValue(searchParams, "evidence");

  if (!range.ok) {
    return range;
  }

  if (!zoneId.ok) {
    return zoneId;
  }

  if (!aiState.ok) {
    return aiState;
  }

  if (!evidence.ok) {
    return evidence;
  }

  if (aiState.value !== null && !isAiState(aiState.value)) {
    return {
      error: `Parameter aiState must be one of ${AI_STATES.join(", ")}.`,
      ok: false,
    };
  }

  const evidenceValue = evidence.value ?? "all";

  if (evidenceValue !== "all" && evidenceValue !== "complete") {
    return {
      error: "Parameter evidence must be all or complete.",
      ok: false,
    };
  }

  if (
    evidenceValue === "complete" &&
    aiState.value !== null &&
    aiState.value !== "COMPLETED"
  ) {
    return {
      error: "evidence=complete cannot be combined with another AI state.",
      ok: false,
    };
  }

  return {
    ok: true,
    value: {
      aiState: aiState.value,
      evidence: evidenceValue,
      range: range.value,
      zoneId: zoneId.value,
    },
  };
}

export function parseDashboardFilters(
  searchParams: URLSearchParams,
): ValidationResult<DashboardFilters> {
  const range = parseDateRange(searchParams);

  if (!range.ok) {
    return range;
  }

  return { ok: true, value: { range: range.value } };
}

export function parseLedgerFilters(
  searchParams: URLSearchParams,
): ValidationResult<LedgerFilters> {
  const shared = parseSharedFilters(searchParams);
  const page = parsePositiveInteger(searchParams, "page", 1, 1_000_000);
  const pageSize = parsePositiveInteger(searchParams, "pageSize", 25, 100);

  if (!shared.ok) {
    return shared;
  }

  if (!page.ok) {
    return page;
  }

  if (!pageSize.ok) {
    return pageSize;
  }

  return {
    ok: true,
    value: { ...shared.value, page: page.value, pageSize: pageSize.value },
  };
}

export function parseLedgerExportFilters(
  searchParams: URLSearchParams,
): ValidationResult<LedgerExportFilters> {
  const shared = parseSharedFilters(searchParams);
  const format = getSingleValue(searchParams, "format");

  if (!shared.ok) {
    return shared;
  }

  if (!format.ok) {
    return format;
  }

  if (format.value !== "csv" && format.value !== "json") {
    return {
      error: "Parameter format must be csv or json.",
      ok: false,
    };
  }

  return {
    ok: true,
    value: { ...shared.value, format: format.value },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMrvReportRequest(
  value: unknown,
): ValidationResult<MrvReportRequest> {
  if (!isRecord(value)) {
    return { error: "Request body must be a JSON object.", ok: false };
  }

  const allowedKeys = new Set([
    "aiConsent",
    "documentType",
    "from",
    "includeNarrative",
    "to",
    "zoneId",
  ]);

  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    return {
      error: "Request body contains an unsupported field.",
      ok: false,
    };
  }

  for (const key of ["from", "to", "zoneId"] as const) {
    if (key in value && typeof value[key] !== "string") {
      return {
        error: `Request field ${key} must be a string when provided.`,
        ok: false,
      };
    }
  }

  if (
    "includeNarrative" in value &&
    typeof value.includeNarrative !== "boolean"
  ) {
    return {
      error: "Request field includeNarrative must be a boolean.",
      ok: false,
    };
  }

  const documentType = value.documentType ?? "SITUATION";

  if (documentType !== "SITUATION" && documentType !== "CARBON_AUDIT") {
    return {
      error: "Request field documentType must be SITUATION or CARBON_AUDIT.",
      ok: false,
    };
  }

  if ("aiConsent" in value && typeof value.aiConsent !== "boolean") {
    return { error: "Request field aiConsent must be a boolean.", ok: false };
  }

  const includeNarrative = value.includeNarrative === true;
  const aiConsent = value.aiConsent === true;

  if (includeNarrative !== aiConsent) {
    return {
      error:
        "AI narrative generation requires explicit aiConsent=true and includeNarrative=true.",
      ok: false,
    };
  }

  const zoneId = value.zoneId;

  if (typeof zoneId === "string" && !UUID_PATTERN.test(zoneId)) {
    return { error: "Request field zoneId must be a UUID.", ok: false };
  }

  const searchParams = new URLSearchParams();

  if (typeof value.from === "string") {
    searchParams.set("from", value.from);
  }

  if (typeof value.to === "string") {
    searchParams.set("to", value.to);
  }

  const dateFilters = parseDashboardFilters(searchParams);

  if (!dateFilters.ok) {
    return dateFilters;
  }

  return {
    ok: true,
    value: {
      aiConsent,
      documentType,
      filters: {
        range: dateFilters.value.range,
        zoneId: typeof zoneId === "string" ? zoneId.toLowerCase() : null,
      },
      includeNarrative,
    },
  };
}
