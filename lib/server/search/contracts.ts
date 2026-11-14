import type { Prisma } from "@/lib/generated/prisma/client";
import { APP_ROUTES } from "@/lib/routes";
import type { AppRole } from "@/lib/roles";
import { handlingStatusLabel } from "@/lib/report-labels";

export type GlobalSearchResult = {
  id: string;
  title: string;
  description: string;
  kind: "Laporan" | "Zona" | "Titik air" | "Hotspot" | "Audit MRV" | "Menu";
  group: "menu" | "data";
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
  matchingIds?: string[],
): Prisma.FieldReportWhereInput {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const contains = { contains: trimmed, mode: "insensitive" as const };
  const normalizedQuery = trimmed
    .replace(/\s+/g, "_")
    .toLocaleUpperCase("id-ID");

  const OR: Prisma.FieldReportWhereInput[] = [
    { zone: { is: { zoneName: contains } } },
    { zone: { is: { villageName: contains } } },
    { fieldNotes: contains },
    { aiSummary: contains },
    {
      tags: {
        hasSome: [
          trimmed,
          lower,
          trimmed.toUpperCase(),
          trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase(),
        ],
      },
    },
  ];

  if (
    lower.includes("lapor") ||
    lower.includes("insiden") ||
    lower.includes("patroli") ||
    lower.includes("report")
  ) {
    OR.push({ createdAt: { gt: new Date(0) } });
  }

  if (UUID_QUERY.test(trimmed)) {
    OR.push({ id: trimmed }, { clientReportId: trimmed });
  }

  if (matchingIds && matchingIds.length > 0) {
    OR.push({ id: { in: matchingIds } });
  }

  HANDLING_STATUSES.forEach((status) => {
    const statusWords = status.toLowerCase().split("_");
    if (
      status === normalizedQuery ||
      statusWords.some((w) => lower.includes(w) || w.includes(lower))
    ) {
      OR.push({ handlingStatus: status });
    }
  });

  REPORT_CATEGORIES.forEach((category) => {
    const catWords = category.toLowerCase().split("_");
    if (
      category === normalizedQuery ||
      catWords.some((w) => lower.includes(w) || w.includes(lower))
    ) {
      OR.push({ aiCategory: category });
    }
  });

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
      report.zone?.zoneName ??
        report.zone?.villageName ??
        "Zona belum ditetapkan",
      handlingStatusLabel(report.handlingStatus),
      report.isDemoSample ? "Sampel demo" : null,
    ]
      .filter(Boolean)
      .join(" · "),
    kind: "Laporan",
    group: "data",
    href:
      role === "RELAWAN"
        ? APP_ROUTES.field.reportDetail(report.id)
        : role === "POSKO"
          ? APP_ROUTES.command.reportDetail(report.id)
          : APP_ROUTES.audit.ledgerReport(report.id),
  };
}
