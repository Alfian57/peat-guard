import type {
  ServerHandlingStatus,
  ServerReportUrgency,
} from "@/lib/client/offline/server-report-client";

export const handlingClasses: Record<ServerHandlingStatus, string> = {
  MENUNGGU_TINDAKAN: "bg-peat-sun/20 text-amber-950",
  DALAM_PENANGANAN: "bg-peat-paper text-peat-forest",
  SELESAI: "bg-safe/10 text-safe",
};
export const urgencyClasses: Record<ServerReportUrgency, string> = {
  KRITIS: "bg-critical/10 text-red-800",
  WASPADA: "bg-peat-sun/20 text-amber-950",
  RENDAH: "bg-peat-paper text-muted-foreground",
};
