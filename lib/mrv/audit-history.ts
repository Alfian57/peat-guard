import type {
  EvidenceReviewDecision,
  MrvEvidenceSnapshot,
  MrvLedgerAuditEntry,
} from "@/lib/server/mrv/contracts";

const AUDIT_EVENT_TYPES = new Set<MrvLedgerAuditEntry["eventType"]>([
  "MRV_EVIDENCE_REVIEWED",
  "REPORT_AI_ANALYSIS_COMPLETED",
  "REPORT_AI_ANALYSIS_FAILED",
  "REPORT_EVIDENCE_RECORDED",
]);
const AI_STATES = new Set(["COMPLETED", "FAILED", "PENDING", "SKIPPED"]);
const AI_CATEGORIES = new Set([
  "API_AKTIF",
  "AMAN_TERKENDALI",
  "ASAP_GAMBUT",
  "SEKAT_KANAL_KERING",
]);
const AI_URGENCIES = new Set(["KRITIS", "RENDAH", "WASPADA"]);
const REVIEW_DECISIONS = new Set<EvidenceReviewDecision>([
  "ACCEPTED",
  "NEEDS_FOLLOW_UP",
  "REJECTED",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readIsoDate(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value !== "string") return null;

  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : null;
}

function readNullableNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function readAiCategory(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" && AI_CATEGORIES.has(value)
    ? value
    : undefined;
}

function readAiUrgency(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" && AI_URGENCIES.has(value)
    ? value
    : undefined;
}

function parseEvidenceSnapshot(value: unknown): MrvEvidenceSnapshot | null {
  if (!isRecord(value)) return null;

  const accuracyMeters = readNullableNumber(value.accuracyMeters);
  const aiCategory = readAiCategory(value.aiCategory);
  const aiConfidence = readNullableNumber(value.aiConfidence);
  const aiState = value.aiState;
  const aiUrgency = readAiUrgency(value.aiUrgency);
  const capturedAt = readIsoDate(value.capturedAt);
  const syncedAt = readIsoDate(value.syncedAt);
  const latitude = value.latitude;
  const longitude = value.longitude;
  const photoSha256 = value.photoSha256 ?? null;

  if (
    accuracyMeters === undefined ||
    (accuracyMeters !== null && accuracyMeters < 0) ||
    aiCategory === undefined ||
    aiConfidence === undefined ||
    (aiConfidence !== null && (aiConfidence < 0 || aiConfidence > 1)) ||
    aiUrgency === undefined ||
    (aiState !== null &&
      (typeof aiState !== "string" || !AI_STATES.has(aiState))) ||
    !capturedAt ||
    !syncedAt ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    typeof value.photoPresent !== "boolean" ||
    (photoSha256 !== null &&
      (typeof photoSha256 !== "string" || !/^[0-9a-f]{64}$/i.test(photoSha256)))
  ) {
    return null;
  }

  return {
    accuracyMeters,
    aiCategory,
    aiConfidence,
    aiState: typeof aiState === "string" ? aiState : null,
    aiUrgency,
    capturedAt,
    latitude,
    longitude,
    photoPresent: value.photoPresent,
    photoSha256,
    syncedAt,
  };
}

function parseClassification(
  value: unknown,
  fallbackState: "COMPLETED" | "FAILED",
): MrvLedgerAuditEntry["classification"] {
  if (!isRecord(value)) {
    return {
      category: null,
      confidence: null,
      state: fallbackState,
      urgency: null,
    };
  }

  const state = value.state;
  const category = readAiCategory(value.category);
  const confidence = readNullableNumber(value.confidence);
  const urgency = readAiUrgency(value.urgency);

  if (
    typeof state !== "string" ||
    !AI_STATES.has(state) ||
    category === undefined ||
    confidence === undefined ||
    (confidence !== null && (confidence < 0 || confidence > 1)) ||
    urgency === undefined
  ) {
    return {
      category: null,
      confidence: null,
      state: fallbackState,
      urgency: null,
    };
  }

  return { category, confidence, state, urgency };
}

function parseReviewDecision(value: unknown): EvidenceReviewDecision | null {
  return typeof value === "string" &&
    REVIEW_DECISIONS.has(value as EvidenceReviewDecision)
    ? (value as EvidenceReviewDecision)
    : null;
}

function readActorRole(
  event: Record<string, unknown>,
  payload: unknown,
): string | null {
  if (isRecord(payload) && typeof payload.actorRole === "string") {
    return payload.actorRole;
  }
  if (isRecord(event.actor) && typeof event.actor.role === "string") {
    return event.actor.role;
  }
  if (
    event.eventType === "REPORT_AI_ANALYSIS_COMPLETED" ||
    event.eventType === "REPORT_AI_ANALYSIS_FAILED"
  ) {
    return "SYSTEM";
  }
  return null;
}

export function parseMrvLedgerAuditEntry(
  value: unknown,
): MrvLedgerAuditEntry | null {
  if (!isRecord(value)) return null;

  const eventType = value.eventType;
  const createdAt = readIsoDate(value.createdAt);
  if (
    typeof eventType !== "string" ||
    !AUDIT_EVENT_TYPES.has(eventType as MrvLedgerAuditEntry["eventType"]) ||
    typeof value.id !== "string" ||
    !createdAt
  ) {
    return null;
  }

  const payload = value.payload;
  const payloadRecord = isRecord(payload) ? payload : null;
  const classification =
    eventType === "REPORT_AI_ANALYSIS_COMPLETED"
      ? parseClassification(payloadRecord?.classification, "COMPLETED")
      : eventType === "REPORT_AI_ANALYSIS_FAILED"
        ? parseClassification(payloadRecord?.classification, "FAILED")
        : null;

  return {
    actorRole: readActorRole(value, payload),
    classification,
    createdAt,
    decision:
      eventType === "MRV_EVIDENCE_REVIEWED"
        ? parseReviewDecision(payloadRecord?.decision)
        : null,
    eventId: value.id,
    eventType: eventType as MrvLedgerAuditEntry["eventType"],
    evidenceSnapshot:
      eventType === "REPORT_EVIDENCE_RECORDED" ||
      eventType === "MRV_EVIDENCE_REVIEWED"
        ? parseEvidenceSnapshot(payloadRecord?.evidenceSnapshot)
        : null,
    source:
      eventType === "REPORT_EVIDENCE_RECORDED" &&
      payloadRecord?.source === "field_sync"
        ? "field_sync"
        : null,
  };
}

export function parseMrvLedgerAuditHistory(
  events: readonly unknown[],
): MrvLedgerAuditEntry[] {
  return events.flatMap((event) => {
    const parsed = parseMrvLedgerAuditEntry(event);
    return parsed ? [parsed] : [];
  });
}
