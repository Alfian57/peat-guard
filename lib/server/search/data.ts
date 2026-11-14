import "server-only";

import type { Prisma } from "@/lib/generated/prisma/client";
import { APP_ROUTES } from "@/lib/routes";
import { waterPointTypeLabel } from "@/lib/water-point-labels";
import { zoneVerificationStatusLabel } from "@/lib/zone-labels";
import { mrvAuditEventLabel } from "@/lib/mrv/audit-event-label";
import { hotspotConfidenceLabel, hotspotSourceLabel } from "@/lib/firms-labels";
import type { AppRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import {
  buildReportSearchWhere,
  canSearchScope,
  toGlobalSearchReportResult,
  type GlobalSearchResult,
} from "@/lib/server/search/contracts";
import { searchMenuCatalog } from "@/lib/server/search/menu-catalog";

const SEARCH_LIMIT = 10;
const HOTSPOT_DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});
const UUID_QUERY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function searchWorkspace(
  query: string,
  role: AppRole,
  userId: string,
): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const contains = { contains: trimmed, mode: "insensitive" as const };
  const normalizedQuery = trimmed
    .replace(/\s+/g, "_")
    .toLocaleUpperCase("id-ID");

  let matchingReportIds: string[] = [];
  let matchingZoneIds: string[] = [];
  let matchingWaterPointIds: string[] = [];

  if (/^[0-9a-f-]{3,36}$/i.test(trimmed)) {
    const clean = trimmed.toLowerCase();
    try {
      const [reportRows, zoneRows, pointRows] = await Promise.all([
        prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM field_reports WHERE id::text ILIKE ${clean + "%"} LIMIT 10
        `,
        prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM forest_zones WHERE archived_at IS NULL AND id::text ILIKE ${clean + "%"} LIMIT 10
        `,
        prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM water_points WHERE id::text ILIKE ${clean + "%"} LIMIT 10
        `,
      ]);
      matchingReportIds = reportRows.map((r) => r.id);
      matchingZoneIds = zoneRows.map((r) => r.id);
      matchingWaterPointIds = pointRows.map((r) => r.id);
    } catch {
      // Raw query fallback
    }
  }

  const reports = await prisma.fieldReport.findMany({
    where: buildReportSearchWhere(query, role, userId, matchingReportIds),
    orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
    take: role === "RELAWAN" ? SEARCH_LIMIT : 4,
    select: {
      id: true,
      handlingStatus: true,
      aiCategory: true,
      isDemoSample: true,
      zone: { select: { zoneName: true, villageName: true } },
    },
  });

  const results: GlobalSearchResult[] = reports.map((report) =>
    toGlobalSearchReportResult(report, role),
  );

  if (canSearchScope(role, "command-data")) {
    const isZoneGeneric =
      lower.includes("zona") ||
      lower.includes("gambut") ||
      lower.includes("hutan") ||
      lower.includes("wilayah");

    const isWaterQuery =
      lower.includes("titik") ||
      lower.includes("air") ||
      lower.includes("water");
    const isSekatQuery = lower.includes("sekat") || lower.includes("kanal");
    const isEmbungQuery = lower.includes("embung");
    const isSumberQuery = lower.includes("sumber");

    const isHotspotQuery =
      lower.includes("hotspot") ||
      lower.includes("panas") ||
      lower.includes("satelit") ||
      lower.includes("firms");

    const zoneOr: Prisma.ForestZoneWhereInput[] = [
      { zoneName: contains },
      { villageName: contains },
      { slug: contains },
    ];
    if (matchingZoneIds.length > 0) {
      zoneOr.push({ id: { in: matchingZoneIds } });
    }
    if (UUID_QUERY.test(query)) {
      zoneOr.push({ id: query });
    }
    if (isZoneGeneric) {
      zoneOr.push({ createdAt: { gt: new Date(0) } });
    }

    const waterPointOr: Prisma.WaterPointWhereInput[] = [
      { name: contains },
      { zone: { is: { zoneName: contains } } },
    ];
    if (matchingWaterPointIds.length > 0) {
      waterPointOr.push({ id: { in: matchingWaterPointIds } });
    }
    if (UUID_QUERY.test(query)) {
      waterPointOr.push({ id: query });
    }
    if (isWaterQuery) {
      waterPointOr.push({ createdAt: { gt: new Date(0) } });
    }
    if (isSekatQuery) {
      waterPointOr.push({ type: "SEKAT_KANAL" });
    }
    if (isEmbungQuery) {
      waterPointOr.push({ type: "EMBUNG" });
    }
    if (isSumberQuery) {
      waterPointOr.push({ type: "SUMBER_AIR" });
    }

    const hotspotOr: Prisma.SatelliteHotspotWhereInput[] = [
      { source: contains },
      { externalId: contains },
      { confidence: contains },
    ];
    if (UUID_QUERY.test(query)) {
      hotspotOr.push({ id: query });
    }
    if (isHotspotQuery) {
      hotspotOr.push({ fetchedAt: { gt: new Date(0) } });
    }

    const [zones, waterPoints, hotspots] = await Promise.all([
      prisma.forestZone.findMany({
        where: { archivedAt: null, OR: zoneOr },
        orderBy: { zoneName: "asc" },
        take: 3,
        select: {
          id: true,
          zoneName: true,
          villageName: true,
          isApproved: true,
        },
      }),
      prisma.waterPoint.findMany({
        where: { OR: waterPointOr },
        orderBy: { name: "asc" },
        take: 3,
        select: {
          id: true,
          name: true,
          type: true,
          zone: { select: { zoneName: true } },
        },
      }),
      prisma.satelliteHotspot.findMany({
        where: { OR: hotspotOr },
        orderBy: { acquiredAt: "desc" },
        take: 2,
        select: {
          id: true,
          source: true,
          confidence: true,
          acquiredAt: true,
          isDemoData: true,
        },
      }),
    ]);

    results.push(
      ...zones.map((zone) => ({
        id: `zone-${zone.id}`,
        title: zone.zoneName,
        description: [
          zone.villageName || "Desa belum ditentukan",
          zoneVerificationStatusLabel(zone.isApproved),
        ].join(" · "),
        kind: "Zona" as const,
        group: "data" as const,
        href: APP_ROUTES.command.editZone(zone.id),
      })),
      ...waterPoints.map((point) => ({
        id: `water-${point.id}`,
        title: point.name,
        description: [
          waterPointTypeLabel(point.type),
          point.zone?.zoneName ?? "Belum dikaitkan ke zona",
        ].join(" · "),
        kind: "Titik air" as const,
        group: "data" as const,
        href: APP_ROUTES.command.editWaterPoint(point.id),
      })),
      ...hotspots.map((hotspot) => ({
        id: `hotspot-${hotspot.id}`,
        title: hotspot.isDemoData ? "Titik panas contoh" : "Hotspot NASA FIRMS",
        description: [
          hotspotSourceLabel(hotspot.source),
          `Keyakinan deteksi ${hotspotConfidenceLabel(hotspot.confidence)}`,
          `Waktu pengamatan ${HOTSPOT_DATE_FORMAT.format(hotspot.acquiredAt)} WIB`,
        ].join(" · "),
        kind: "Hotspot" as const,
        group: "data" as const,
        href: APP_ROUTES.command.map,
      })),
    );
  }

  // Account / User search
  if (canSearchScope(role, "audit-data")) {
    const isAuditGeneric =
      lower.includes("audit") ||
      lower.includes("mrv") ||
      lower.includes("ledger") ||
      lower.includes("buku") ||
      lower.includes("verif");

    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        reportId: { not: null },
        OR: [
          { eventType: contains },
          ...(normalizedQuery !== query
            ? [
                {
                  eventType: {
                    contains: normalizedQuery,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
          { aggregateType: contains },
          ...(UUID_QUERY.test(query)
            ? [{ aggregateId: query }, { reportId: query }]
            : []),
          ...(isAuditGeneric ? [{ createdAt: { gt: new Date(0) } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: SEARCH_LIMIT,
      select: {
        id: true,
        eventType: true,
        aggregateId: true,
        reportId: true,
        createdAt: true,
      },
    });

    results.push(
      ...auditEvents.map((event) => ({
        id: `audit-${event.id}`,
        title: mrvAuditEventLabel(event.eventType),
        description: `ID referensi ${event.aggregateId.slice(0, 8)} · ${event.createdAt.toLocaleString("id-ID")}`,
        kind: "Audit MRV" as const,
        group: "data" as const,
        href: APP_ROUTES.audit.ledgerReport(
          event.reportId ?? event.aggregateId,
        ),
      })),
    );
  }

  const menuResults = searchMenuCatalog(query, role);
  return [...menuResults, ...results].slice(0, 16);
}
