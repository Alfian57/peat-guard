import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import {
  type HandlingStatus as HandlingStatusValue,
  type ReportCategory as ReportCategoryValue,
  type ReportUrgency as ReportUrgencyValue,
} from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { assertRoleAccess } from "@/lib/role-access";
import type { ReportMapFilters } from "@/lib/server/command/report-map-input";

export const COMMAND_REPORT_MAP_POINT_LIMIT = 250;

type ReportMapRow = {
  id: string;
  latitude: number;
  longitude: number;
  capturedAt: Date;
  aiUrgency: ReportUrgencyValue | null;
  aiCategory: ReportCategoryValue | null;
  handlingStatus: HandlingStatusValue;
  isDemoSample: boolean;
};

export type CommandReportMapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
  aiUrgency: ReportUrgencyValue | null;
  aiCategory: ReportCategoryValue | null;
  handlingStatus: HandlingStatusValue;
  isDemoSample: boolean;
};

export async function getCommandReportMapPoints(
  role: unknown,
  filters: ReportMapFilters,
): Promise<{
  points: CommandReportMapPoint[];
  truncated: boolean;
  limit: number;
}> {
  assertRoleAccess(true, role, ["POSKO"]);

  const predicates = [
    Prisma.sql`report.location && ST_MakeEnvelope(
      ${filters.west}, ${filters.south}, ${filters.east}, ${filters.north}, 4326
    )`,
  ];

  if (filters.from) {
    predicates.push(Prisma.sql`report.captured_at >= ${filters.from}`);
  }
  if (filters.toExclusive) {
    predicates.push(Prisma.sql`report.captured_at < ${filters.toExclusive}`);
  }
  if (filters.status) {
    predicates.push(
      Prisma.sql`report.handling_status = ${filters.status}::"HandlingStatus"`,
    );
  }
  if (filters.urgency === "UNRATED") {
    predicates.push(Prisma.sql`report.ai_urgency IS NULL`);
  } else if (filters.urgency) {
    predicates.push(
      Prisma.sql`report.ai_urgency = ${filters.urgency}::"ReportUrgency"`,
    );
  }

  const rows = await prisma.$queryRaw<ReportMapRow[]>(Prisma.sql`
    SELECT
      report.id::text AS id,
      report.latitude::double precision AS latitude,
      report.longitude::double precision AS longitude,
      report.captured_at AS "capturedAt",
      report.ai_urgency AS "aiUrgency",
      report.ai_category AS "aiCategory",
      report.handling_status AS "handlingStatus",
      report.is_demo_sample AS "isDemoSample"
    FROM field_reports AS report
    WHERE ${Prisma.join(predicates, " AND ")}
    ORDER BY report.captured_at DESC, report.id DESC
    LIMIT ${COMMAND_REPORT_MAP_POINT_LIMIT + 1}
  `);

  const truncated = rows.length > COMMAND_REPORT_MAP_POINT_LIMIT;
  const points = rows
    .slice(0, COMMAND_REPORT_MAP_POINT_LIMIT)
    .map(toCommandReportMapPoint);

  return { points, truncated, limit: COMMAND_REPORT_MAP_POINT_LIMIT };
}

function toCommandReportMapPoint(row: ReportMapRow): CommandReportMapPoint {
  return {
    id: row.id,
    latitude: row.latitude,
    longitude: row.longitude,
    capturedAt: row.capturedAt.toISOString(),
    aiUrgency: row.aiUrgency,
    aiCategory: row.aiCategory,
    handlingStatus: row.handlingStatus,
    isDemoSample: row.isDemoSample,
  };
}
