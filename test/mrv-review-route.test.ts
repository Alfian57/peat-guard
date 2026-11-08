import {
  afterAll,
  afterEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";

import { AuthorizationError } from "@/lib/role-access";
import type { AppRole } from "@/lib/roles";
import type { MrvLedgerAuditEntry } from "@/lib/server/mrv/contracts";
import * as reviewMod from "@/lib/server/mrv/review";

const reportId = "61000000-0000-4000-8000-000000000001";
let activeRole: AppRole | null = null;

const reviewEntry: MrvLedgerAuditEntry = {
  actorRole: "VERIFIKATOR",
  classification: null,
  createdAt: "2026-11-15T03:00:00.000Z",
  decision: "ACCEPTED",
  eventId: "63000000-0000-4000-8000-000000000001",
  eventType: "MRV_EVIDENCE_REVIEWED",
  evidenceSnapshot: {
    accuracyMeters: 20,
    aiCategory: null,
    aiConfidence: null,
    aiState: "SKIPPED",
    aiUrgency: null,
    capturedAt: "2026-11-15T02:24:00.000Z",
    latitude: -2.3,
    longitude: 113.9,
    photoPresent: true,
    photoSha256: "a".repeat(64),
    syncedAt: "2026-11-15T02:31:00.000Z",
  },
  source: null,
};

const recordReview = mock(async () => reviewEntry);
const recordReviewSpy = spyOn(
  reviewMod,
  "recordMrvEvidenceReview",
).mockImplementation(recordReview);

mock.module("@/lib/authz", () => ({
  AuthorizationError,
  requireRole: async (allowedRoles: readonly AppRole[]) => {
    if (activeRole === null) throw new AuthorizationError(401);
    if (!allowedRoles.includes(activeRole)) throw new AuthorizationError(403);
    return {
      user: {
        email: "verifier@example.test",
        id: "62000000-0000-4000-8000-000000000001",
        role: activeRole,
      },
    };
  },
}));

const { POST } =
  await import("@/app/api/command/mrv/ledger/[reportId]/review/route");

function makeRequest(
  payload: unknown = { decision: "ACCEPTED" },
  origin = "http://localhost",
): Request {
  return new Request(
    `http://localhost/api/command/mrv/ledger/${reportId}/review`,
    {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}

function makeContext(id = reportId) {
  return { params: Promise.resolve({ reportId: id }) };
}

afterEach(() => {
  activeRole = null;
  recordReview.mockClear();
});

afterAll(() => {
  recordReviewSpy.mockRestore();
});

describe("MRV evidence review route", () => {
  test("denies anonymous and non-verifier callers without recording a review", async () => {
    const anonymous = await POST(makeRequest(), makeContext());
    expect(anonymous.status).toBe(401);

    activeRole = "POSKO";
    const posko = await POST(makeRequest(), makeContext());
    expect(posko.status).toBe(403);
    expect(recordReview).not.toHaveBeenCalled();
  });

  test("rejects cross-origin, invalid body, and malformed report ID", async () => {
    activeRole = "VERIFIKATOR";

    expect(
      (
        await POST(
          makeRequest({ decision: "ACCEPTED" }, "http://evil.test"),
          makeContext(),
        )
      ).status,
    ).toBe(403);
    expect(
      (await POST(makeRequest({ decision: "GPS_VERIFIED" }), makeContext()))
        .status,
    ).toBe(400);
    expect((await POST(makeRequest(), makeContext("invalid"))).status).toBe(
      400,
    );
    expect(recordReview).not.toHaveBeenCalled();
  });

  test("appends review events with private response headers", async () => {
    activeRole = "VERIFIKATOR";
    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toContain("Cookie");
    expect(await response.json()).toEqual({ review: reviewEntry });
    expect(recordReview).toHaveBeenCalledWith(
      {
        email: "verifier@example.test",
        id: "62000000-0000-4000-8000-000000000001",
        role: "VERIFIKATOR",
      },
      reportId,
      "ACCEPTED",
    );
  });
});
