import { expect, mock, test } from "bun:test";

const reportId = "61000000-0000-4000-8000-000000000001";
const findMany = mock(async (args: { where: Record<string, unknown> }) => {
  void args;
  return [
    {
      accuracyMeters: null,
      aiCategory: null,
      aiConfidence: null,
      aiState: "SKIPPED",
      aiUrgency: null,
      auditEvents: [],
      capturedAt: new Date("2026-11-15T02:24:00.000Z"),
      createdAt: new Date("2026-11-15T02:25:00.000Z"),
      handlingStatus: "MENUNGGU_TINDAKAN",
      id: reportId,
      imagePath: "private-photo.webp",
      isDemoSample: false,
      latitude: -2.3194,
      longitude: 113.9102,
      statusEvents: [],
      syncedAt: new Date("2026-11-15T02:31:00.000Z"),
      zone: null,
    },
  ];
});
const count = mock(async (where: Record<string, unknown>) => {
  void where;
  return 1;
});

mock.module("@/lib/prisma", () => ({
  prisma: { fieldReport: { count, findMany } },
}));

const { getMrvLedger } = await import("@/lib/server/mrv/data");

test("complete evidence means stored coordinates and photo independently of AI", async () => {
  const ledger = await getMrvLedger({
    aiState: "SKIPPED",
    evidence: "complete",
    page: 1,
    pageSize: 25,
    range: null,
    zoneId: null,
  });

  expect(findMany.mock.calls[0]?.[0].where).toEqual({
    aiState: "SKIPPED",
    imagePath: { not: "" },
  });
  expect(ledger.rows[0]).toMatchObject({
    aiTriage: { state: "SKIPPED" },
    evidenceStatus: "complete",
    hasPhoto: true,
  });
});
