import type { Prisma } from "@/lib/generated/prisma/client";
import { APP_ROUTES } from "@/lib/routes";
import type { AppRole } from "@/lib/roles";

export type GlobalSearchResult = {
  id: string;
  title: string;
  description: string;
  kind: "Laporan" | "Zona" | "Titik air" | "Hotspot" | "Audit MRV";
  href: string;
};

export type GlobalSearchScope = "reports" | "command-data" | "audit-data";

export function canSearchScope(
  role: AppRole,
  scope: GlobalSearchScope,
): boolean {
  if (scope === "reports") return true;
  if (scope === "command-data") return role === "POSKO";
  return role === "VERIFIKATOR";
}

const UUID_QUERY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HANDLING_STATUSES = [
  "MENUNGGU_TINDAKAN",
  "DALAM_PENANGANAN",
  "SELESAI",
] as const;
const REPORT_CATEGORIES = [
  "API_AKTIF",
  "ASAP_GAMBUT",
  "SEKAT_KANAL_KERING",
  "AMAN_TERKENDALI",
] as const;

export function buildReportSearchWhere(
  query: string,
  role: AppRole,
  userId: string,
): Prisma.FieldReportWhereInput {
  const contains = { contains: query, mode: "insensitive" as const };
  const normalizedQuery = query
    .trim()
    .replace(/\s+/g, "_")
    .toLocaleUpperCase("id-ID");
  const OR: Prisma.FieldReportWhereInput[] = [
    { zone: { is: { zoneName: contains } } },
    { zone: { is: { villageName: contains } } },
  ];
  if (UUID_QUERY.test(query)) OR.push({ id: query });
  if (
    HANDLING_STATUSES.includes(
      normalizedQuery as (typeof HANDLING_STATUSES)[number],
    )
  ) {
    OR.push({
      handlingStatus: normalizedQuery as (typeof HANDLING_STATUSES)[number],
    });
  }
  if (
    REPORT_CATEGORIES.includes(
      normalizedQuery as (typeof REPORT_CATEGORIES)[number],
    )
  ) {
    OR.push({
      aiCategory: normalizedQuery as (typeof REPORT_CATEGORIES)[number],
    });
  }

  return {
    ...(role === "RELAWAN" ? { reporterId: userId } : {}),
    OR,
  };
}

export function toGlobalSearchReportResult(
  report: {
    id: string;
    handlingStatus: string;
    isDemoSample: boolean;
    zone: { zoneName: string; villageName: string | null } | null;
  },
  role: AppRole,
): GlobalSearchResult {
  return {
    id: `report-${report.id}`,
    title: `Laporan ${report.id.slice(0, 8)}`,
    description: [
      report.zone?.zoneName ?? report.zone?.villageName ?? "Belum terkait zona",
      report.handlingStatus.replaceAll("_", " "),
      report.isDemoSample ? "Data ilustratif" : null,
    ]
      .filter(Boolean)
      .join(" · "),
    kind: "Laporan",
    href:
      role === "RELAWAN"
        ? APP_ROUTES.field.reportDetail(report.id)
        : role === "POSKO"
          ? APP_ROUTES.command.reportDetail(report.id)
          : APP_ROUTES.audit.ledgerReport(report.id),
  };
}
