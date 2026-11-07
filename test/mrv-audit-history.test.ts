import { describe, expect, test } from "bun:test";

import {
  parseMrvLedgerAuditEntry,
  parseMrvLedgerAuditHistory,
} from "@/lib/mrv/audit-history";

const evidenceSnapshot = {
  accuracyMeters: 17.5,
  aiCategory: "ASAP_GAMBUT",
  aiConfidence: 0.94,
  aiState: "COMPLETED",
  aiUrgency: "WASPADA",
  capturedAt: "2026-11-15T02:24:00.000Z",
  latitude: -2.3194,
  longitude: 113.9102,
  photoPresent: true,
  photoSha256: "a".repeat(64),
  syncedAt: "2026-11-15T02:31:00.000Z",
};

describe("MRV immutable evidence history", () => {
  test("returns only allowlisted evidence and review fields", () => {
    const event = parseMrvLedgerAuditEntry({
      actor: { role: "VERIFIKATOR" },
      createdAt: new Date("2026-11-15T03:00:00.000Z"),
      eventType: "MRV_EVIDENCE_REVIEWED",
      id: "63000000-0000-4000-8000-000000000001",
      payload: {
        actorRole: "VERIFIKATOR",
        decision: "ACCEPTED",
        evidenceSnapshot: evidenceSnapshot,
        fieldNotes: "must not be returned",
        imagePath: "/private/uploads/photo.webp",
        reporterName: "must not be returned",
      },
    });

    expect(event).toEqual({
      actorRole: "VERIFIKATOR",
      classification: null,
      createdAt: "2026-11-15T03:00:00.000Z",
      decision: "ACCEPTED",
      eventId: "63000000-0000-4000-8000-000000000001",
      eventType: "MRV_EVIDENCE_REVIEWED",
      evidenceSnapshot,
      source: null,
    });
    expect(JSON.stringify(event)).not.toContain("private/uploads");
    expect(JSON.stringify(event)).not.toContain("reporterName");
    expect(JSON.stringify(event)).not.toContain("fieldNotes");
  });

  test("parses the database-created evidence event and enriched AI classification", () => {
    const events = parseMrvLedgerAuditHistory([
      {
        actor: { role: "RELAWAN" },
        createdAt: "2026-11-15T02:31:00.000Z",
        eventType: "REPORT_EVIDENCE_RECORDED",
        id: "63000000-0000-4000-8000-000000000002",
        payload: {
          actorRole: "RELAWAN",
          evidenceSnapshot,
          source: "field_sync",
        },
      },
      {
        actor: null,
        createdAt: "2026-11-15T02:32:00.000Z",
        eventType: "REPORT_AI_ANALYSIS_COMPLETED",
        id: "63000000-0000-4000-8000-000000000003",
        payload: {
          classification: {
            category: "ASAP_GAMBUT",
            confidence: 0.94,
            state: "COMPLETED",
            urgency: "WASPADA",
          },
        },
      },
      {
        createdAt: "2026-11-15T02:33:00.000Z",
        eventType: "REPORT_STATUS_CHANGED",
        id: "63000000-0000-4000-8000-000000000004",
      },
    ]);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      actorRole: "RELAWAN",
      eventType: "REPORT_EVIDENCE_RECORDED",
      evidenceSnapshot,
      source: "field_sync",
    });
    expect(events[1]).toMatchObject({
      actorRole: "SYSTEM",
      classification: {
        category: "ASAP_GAMBUT",
        confidence: 0.94,
        state: "COMPLETED",
        urgency: "WASPADA",
      },
      eventType: "REPORT_AI_ANALYSIS_COMPLETED",
    });
  });

  test("drops malformed evidence payloads and unknown audit event types", () => {
    expect(
      parseMrvLedgerAuditEntry({
        createdAt: "2026-11-15T03:00:00.000Z",
        eventType: "MRV_EVIDENCE_REVIEWED",
        id: "63000000-0000-4000-8000-000000000005",
        payload: {
          decision: "ACCEPTED",
          evidenceSnapshot: { ...evidenceSnapshot, latitude: 99 },
        },
      })?.evidenceSnapshot,
    ).toBeNull();

    expect(
      parseMrvLedgerAuditEntry({
        createdAt: "2026-11-15T03:00:00.000Z",
        eventType: "REPORT_CREATED",
        id: "63000000-0000-4000-8000-000000000006",
        payload: {},
      }),
    ).toBeNull();
  });

  test("preserves an evidence snapshot when legacy AI state is unavailable", () => {
    const parsed = parseMrvLedgerAuditEntry({
      createdAt: "2026-11-15T03:00:00.000Z",
      eventType: "REPORT_EVIDENCE_RECORDED",
      id: "63000000-0000-4000-8000-000000000007",
      payload: {
        evidenceSnapshot: { ...evidenceSnapshot, aiState: null },
      },
    });

    expect(parsed?.evidenceSnapshot?.aiState).toBeNull();
  });
});
