import type {
  ServerReportSummary,
  ServerReportCategory,
  ServerReportUrgency,
  ServerHandlingStatus,
} from "@/lib/client/offline/server-report-client";

export const CATEGORY_LABELS: Record<ServerReportCategory, string> = {
  API_AKTIF: "Api aktif",
  ASAP_GAMBUT: "Asap gambut",
  SEKAT_KANAL_KERING: "Sekat kanal kering",
  AMAN_TERKENDALI: "Aman terkendali",
};

export const URGENCY_LABELS: Record<ServerReportUrgency, string> = {
  KRITIS: "Kritis",
  WASPADA: "Waspada",
  RENDAH: "Rendah",
};

export const HANDLING_LABELS: Record<ServerHandlingStatus, string> = {
  MENUNGGU_TINDAKAN: "Menunggu tindakan",
  DALAM_PENANGANAN: "Dalam penanganan",
  SELESAI: "Selesai",
};

export function formatCapturedAt(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function reportSummaryTitle(report: ServerReportSummary): string {
  return report.aiCategory
    ? CATEGORY_LABELS[report.aiCategory]
    : "Laporan patroli";
}
