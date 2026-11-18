import {
  afterAll,
  afterEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import { createHash } from "node:crypto";

import { AuthorizationError } from "@/lib/role-access";

const reportId = "61000000-0000-4000-8000-000000000001";
const actor = {
  email: "verifier@example.test",
  id: "62000000-0000-4000-8000-000000000001",
  role: "VERIFIKATOR" as const,
};
const photoBytes = Buffer.from("normalized-webp-photo-bytes");
let report = {
  accuracyMeters: 22,
  aiCategory: null as string | null,
  aiConfidence: null as number | null,
  aiState: "SKIPPED" as string | null,
  aiUrgency: null as string | null,
  capturedAt: new Date("2026-11-15T02:24:00.000Z"),
  id: reportId,
  imagePath: "private-storage-name.webp",
  latitude: -2.3194,
  longitude: 113.9102,
  syncedAt: new Date("2026-11-15T02:31:00.000Z"),
};
let storedPhoto: Buffer | null = photoBytes;

const findUnique = mock(async () => report);
const create = mock(async ({ data }: { data: Record<string, unknown> }) => ({
  id: "63000000-0000-4000-8000-000000000001",
  createdAt: new Date("2026-11-15T03:00:00.000Z"),
  data,
}));
const transactionClient = {
  auditEvent: { create, findFirst: mock(async () => null) },
  $executeRaw: mock(async () => 0),
  $queryRaw: mock(async () => []),
  fieldReport: { findUnique },
};
const transaction = mock(
  async (callback: (client: typeof transactionClient) => Promise<unknown>) =>
    callback(transactionClient),
);
const readPrivatePhoto = mock(async () => storedPhoto);
const photoMod = await import("@/lib/server/uploads/private-photo");
const readPrivatePhotoSpy = spyOn(
  photoMod,
  "readPrivateReportPhoto",
).mockImplementation(readPrivatePhoto);

mock.module("@/lib/prisma", () => ({
  prisma: { $transaction: transaction },
}));

const { recordMrvEvidenceReview, MrvEvidenceReviewError } =
  await import("@/lib/server/mrv/review");

afterEach(() => {
  report = {
    accuracyMeters: 22,
    aiCategory: null,
    aiConfidence: null,
    aiState: "SKIPPED",
    aiUrgency: null,
    capturedAt: new Date("2026-11-15T02:24:00.000Z"),
    id: reportId,
    imagePath: "private-storage-name.webp",
    latitude: -2.3194,
    longitude: 113.9102,
    syncedAt: new Date("2026-11-15T02:31:00.000Z"),
  };
  storedPhoto = photoBytes;
  findUnique.mockClear();
  create.mockClear();
  transaction.mockClear();
  readPrivatePhoto.mockClear();
});

afterAll(() => {
  readPrivatePhotoSpy.mockRestore();
});

describe("append-only MRV evidence review", () => {
  test("accepts stored coordinates and photo even when AI triage was skipped", async () => {
    const result = await recordMrvEvidenceReview(actor, reportId, "ACCEPTED");
    const createData = create.mock.calls[0]?.[0]?.data;

    expect(result).toMatchObject({
      actorRole: "VERIFIKATOR",
      decision: "ACCEPTED",
      eventType: "MRV_EVIDENCE_REVIEWED",
      evidenceSnapshot: {
        aiState: "SKIPPED",
        photoPresent: true,
        photoSha256: createHash("sha256").update(photoBytes).digest("hex"),
      },
    });
    expect(createData).toMatchObject({
      actorId: actor.id,
      eventType: "MRV_EVIDENCE_REVIEWED",
      payload: {
        actorRole: "VERIFIKATOR",
        decision: "ACCEPTED",
      },
    });
    expect(JSON.stringify(createData)).not.toContain("private-storage-name");
    expect(JSON.stringify(createData)).not.toContain("fieldNotes");
  });

  test("does not accept missing photos and does not append a decision", async () => {
    storedPhoto = null;

    await expect(
      recordMrvEvidenceReview(actor, reportId, "ACCEPTED"),
    ).rejects.toBeInstanceOf(MrvEvidenceReviewError);
    expect(create).not.toHaveBeenCalled();
  });

  test("records a follow-up decision even when photo or AI triage is absent", async () => {
    storedPhoto = null;
    report = { ...report, imagePath: "", aiState: "SKIPPED" };

    const result = await recordMrvEvidenceReview(
      actor,
      reportId,
      "NEEDS_FOLLOW_UP",
      { note: "Periksa ulang lokasi." },
    );

    expect(result).toMatchObject({
      decision: "NEEDS_FOLLOW_UP",
      evidenceSnapshot: { aiState: "SKIPPED", photoPresent: false },
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("rejects callers without the verifier role before looking up a report", async () => {
    await expect(
      recordMrvEvidenceReview(
        { ...actor, role: "POSKO" },
        reportId,
        "REJECTED",
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
