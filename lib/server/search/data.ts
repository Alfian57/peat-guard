import "server-only";

import { APP_ROUTES } from "@/lib/routes";
import type { AppRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import {
  buildReportSearchWhere,
  canSearchScope,
  toGlobalSearchReportResult,
  type GlobalSearchResult,
} from "@/lib/server/search/contracts";

const SEARCH_LIMIT = 10;
const UUID_QUERY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function searchWorkspace(
  query: string,
  role: AppRole,
  userId: string,
): Promise<GlobalSearchResult[]> {
  const contains = { contains: query, mode: "insensitive" as const };
  const normalizedQuery = query
    .trim()
    .replace(/\s+/g, "_")
    .toLocaleUpperCase("id-ID");
  const reports = await prisma.fieldReport.findMany({
    where: buildReportSearchWhere(query, role, userId),
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
    const [zones, waterPoints, hotspots] = await Promise.all([
      prisma.forestZone.findMany({
        where: {
          OR: [
            { zoneName: contains },
            { villageName: contains },
            { slug: contains },
            ...(UUID_QUERY.test(query) ? [{ id: query }] : []),
          ],
        },
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
        where: {
          OR: [
            { name: contains },
            { zone: { is: { zoneName: contains } } },
            ...(UUID_QUERY.test(query) ? [{ id: query }] : []),
            ...(normalizedQuery === "SEKAT_KANAL" ||
            normalizedQuery === "EMBUNG" ||
            normalizedQuery === "SUMBER_AIR"
              ? [
                  {
                    type: normalizedQuery as
                      "SEKAT_KANAL" | "EMBUNG" | "SUMBER_AIR",
                  },
                ]
              : []),
          ],
        },
        orderBy: { name: "asc" },
        take: 2,
        select: {
          id: true,
          name: true,
          type: true,
          zone: { select: { zoneName: true } },
        },
      }),
      prisma.satelliteHotspot.findMany({
        where: {
          OR: [
            { source: contains },
            { externalId: contains },
            { confidence: contains },
            ...(UUID_QUERY.test(query) ? [{ id: query }] : []),
          ],
        },
        orderBy: { acquiredAt: "desc" },
        take: 1,
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
        description: `${zone.villageName ?? "Desa belum ditentukan"} · ${zone.isApproved ? "Terverifikasi" : "Menunggu verifikasi"}`,
        kind: "Zona" as const,
        href: APP_ROUTES.command.editZone(zone.id),
      })),
      ...waterPoints.map((point) => ({
        id: `water-${point.id}`,
        title: point.name,
        description: `${point.type.replaceAll("_", " ")} · ${point.zone?.zoneName ?? "Tanpa zona"}`,
        kind: "Titik air" as const,
        href: APP_ROUTES.command.waterPoints,
      })),
      ...hotspots.map((hotspot) => ({
        id: `hotspot-${hotspot.id}`,
        title: `Hotspot ${hotspot.source}`,
        description: `${hotspot.confidence ?? "Keyakinan tidak tersedia"} · ${hotspot.isDemoData ? "Data ilustratif" : "Data satelit"} · ${hotspot.acquiredAt.toLocaleString("id-ID")}`,
        kind: "Hotspot" as const,
        href: APP_ROUTES.command.map,
      })),
    );
  }

  if (canSearchScope(role, "audit-data")) {
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
        title: event.eventType.replaceAll("_", " "),
        description: `ID referensi ${event.aggregateId.slice(0, 8)} · ${event.createdAt.toLocaleString("id-ID")}`,
        kind: "Audit MRV" as const,
        href: APP_ROUTES.audit.ledgerReport(
          event.reportId ?? event.aggregateId,
        ),
      })),
    );
  }

  return results.slice(0, SEARCH_LIMIT);
}
