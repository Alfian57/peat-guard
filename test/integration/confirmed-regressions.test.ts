import { expect, test } from "bun:test";
import type { Prisma } from "@/lib/generated/prisma/client";
import { DEMO_USERS } from "@/lib/demo-login";
import { prisma } from "@/lib/prisma";
import { getMrvReportSource } from "@/lib/server/mrv/report-data";
import {
  claimReportAnalysis,
  finishReportAnalysis,
} from "@/lib/server/reports/ai-job";
import { approveZoneReview, archiveZone } from "@/lib/server/zones/data";

async function withRollback(
  check: (transaction: Prisma.TransactionClient) => Promise<void>,
) {
  const rollback = new Error("rollback regression fixtures");
  try {
    await prisma.$transaction(async (transaction) => {
      await check(transaction);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

test("MRV excludes waiting reports from each response-time mean", async () => {
  const reports = await prisma.$queryRaw<
    Array<{ minutes: number | null; demo: boolean }>
  >`
    SELECT EXTRACT(EPOCH FROM (MIN(event.created_at) - report.created_at))::double precision / 60 AS minutes,
      report.is_demo_sample AS demo
    FROM field_reports AS report
    LEFT JOIN report_status_events AS event
      ON event.report_id = report.id AND event.next_status = 'DALAM_PENANGANAN'
    GROUP BY report.id
  `;
  function mean(demo?: boolean) {
    const minutes = reports.flatMap((row) =>
      row.minutes === null || (demo !== undefined && row.demo !== demo)
        ? []
        : [Math.max(0, row.minutes)],
    );
    return minutes.length
      ? minutes.reduce((sum, value) => sum + value, 0) / minutes.length
      : null;
  }
  expect(reports.some(({ minutes }) => minutes === null)).toBe(true);
  expect(reports.some(({ minutes }) => minutes !== null)).toBe(true);
  const source = await getMrvReportSource({ zoneId: null, range: null });
  const values = [
    source?.reports.responseMinutes,
    source?.reports.demoResponseMinutes,
    source?.reports.nonDemoResponseMinutes,
  ];
  [mean(), mean(true), mean(false)].forEach((expected, index) => {
    if (expected === null) expect(values[index]).toBeNull();
    else expect(values[index]).toBeCloseTo(expected, 7);
  });
});

test("approves one reviewed revision and archives an unused zone with its carbon history", async () => {
  await withRollback(async (transaction) => {
    const id = crypto.randomUUID();
    const posko = DEMO_USERS.find(({ role }) => role === "POSKO")!;
    const verifier = DEMO_USERS.find(({ role }) => role === "VERIFIKATOR")!;
    await transaction.$executeRaw`
      INSERT INTO forest_zones (id, slug, zone_name, boundary, carbon_parameter_set_id, review_revision, updated_at)
      SELECT ${id}::uuid, ${"audit-zone-" + id}, 'Zona pengujian',
        ST_GeomFromText('POLYGON((113 -2, 113.01 -2, 113.01 -2.01, 113 -2))', 4326),
        id, 2, CURRENT_TIMESTAMP
      FROM carbon_parameter_sets WHERE is_active LIMIT 1
    `;
    await expect(
      approveZoneReview(transaction, id, verifier.id, 1),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      await approveZoneReview(transaction, id, verifier.id, 2),
    ).toMatchObject({ alreadyApproved: false });
    expect(
      await approveZoneReview(transaction, id, verifier.id, 2),
    ).toMatchObject({ alreadyApproved: true });
    const waterId = crypto.randomUUID();
    await transaction.$executeRaw`
      INSERT INTO water_points (id, zone_id, name, type, latitude, longitude, location, updated_at)
      VALUES (${waterId}::uuid, ${id}::uuid, 'Titik pengujian', 'SUMBER_AIR', -2, 113,
        ST_SetSRID(ST_MakePoint(113, -2), 4326), CURRENT_TIMESTAMP)
    `;
    await expect(archiveZone(transaction, id, posko.id)).rejects.toMatchObject({
      status: 409,
    });
    await transaction.waterPoint.delete({ where: { id: waterId } });
    await archiveZone(transaction, id, posko.id);
    await archiveZone(transaction, id, posko.id);
    await expect(
      approveZoneReview(transaction, id, verifier.id, 2),
    ).rejects.toMatchObject({ status: 404 });
    const snapshots = await transaction.forestZoneCarbonSnapshot.findMany({
      where: { zoneId: id },
      select: { isZoneApproved: true },
      orderBy: { id: "asc" },
    });
    expect(snapshots.map(({ isZoneApproved }) => isZoneApproved)).toEqual([
      false,
      true,
      false,
    ]);
    expect(
      await transaction.auditEvent.count({
        where: { aggregateId: id, eventType: "ZONE_ARCHIVED" },
      }),
    ).toBe(1);
  });
});

test("reclaims an interrupted AI analysis and rejects completion with its old token", async () => {
  await withRollback(async (transaction) => {
    const id = crypto.randomUUID();
    const volunteer = DEMO_USERS.find(({ role }) => role === "RELAWAN")!;
    await transaction.$executeRaw`
      INSERT INTO field_reports (id, client_report_id, reporter_id, latitude, longitude, location,
        image_path, captured_at, ai_consent, ai_state, created_at, updated_at)
      VALUES (${id}::uuid, ${id}::uuid, ${volunteer.id}::uuid, -2, 114,
        ST_SetSRID(ST_MakePoint(114, -2), 4326), '', CURRENT_TIMESTAMP, TRUE, 'PENDING',
        '2000-01-01T00:00:00Z'::timestamptz, CURRENT_TIMESTAMP)
    `;
    const first = await claimReportAnalysis(transaction);
    expect(first?.id).toBe(id);
    if (!first) throw new Error("First job was not claimed");
    await transaction.$executeRaw`
      UPDATE field_reports SET ai_lease_until = clock_timestamp() - interval '1 second',
        ai_attempts = 3 WHERE id = ${id}::uuid
    `;
    const recovered = await claimReportAnalysis(transaction);
    expect(recovered).toMatchObject({ id, exhausted: true });
    if (!recovered) throw new Error("Expired job was not recovered");
    await finishReportAnalysis(transaction, first, null);
    expect(
      (
        await transaction.fieldReport.findUnique({
          where: { id },
          select: { aiState: true },
        })
      )?.aiState,
    ).toBe("PENDING");
    await finishReportAnalysis(transaction, recovered, null);
    await finishReportAnalysis(transaction, recovered, null);
    expect(
      (
        await transaction.fieldReport.findUnique({
          where: { id },
          select: { aiState: true },
        })
      )?.aiState,
    ).toBe("FAILED");
    expect(
      await transaction.auditEvent.count({
        where: { reportId: id, eventType: "REPORT_AI_ANALYSIS_FAILED" },
      }),
    ).toBe(1);
  });
});
