import {
  AIAnalysisState,
  HandlingStatus,
  ReportCategory,
  ReportUrgency,
  type AIAnalysisState as AIAnalysisStateValue,
  type HandlingStatus as HandlingStatusValue,
  type ReportCategory as ReportCategoryValue,
  type ReportUrgency as ReportUrgencyValue,
} from "@/lib/generated/prisma/enums";

export const REPORT_AI_STATES: AIAnalysisStateValue[] = [
  AIAnalysisState.COMPLETED,
  AIAnalysisState.PENDING,
  AIAnalysisState.FAILED,
  AIAnalysisState.SKIPPED,
];

export const REPORT_URGENCIES: ReportUrgencyValue[] = [
  ReportUrgency.KRITIS,
  ReportUrgency.WASPADA,
  ReportUrgency.RENDAH,
];

const HANDLING_STATUS_LABELS: Record<HandlingStatusValue, string> = {
  [HandlingStatus.MENUNGGU_TINDAKAN]: "Menunggu tindakan",
  [HandlingStatus.DALAM_PENANGANAN]: "Dalam penanganan",
  [HandlingStatus.SELESAI]: "Selesai",
};

const URGENCY_LABELS: Record<ReportUrgencyValue, string> = {
  [ReportUrgency.KRITIS]: "Kritis",
  [ReportUrgency.WASPADA]: "Waspada",
  [ReportUrgency.RENDAH]: "Rendah",
};

const CATEGORY_LABELS: Record<ReportCategoryValue, string> = {
  [ReportCategory.API_AKTIF]: "Api aktif",
  [ReportCategory.ASAP_GAMBUT]: "Asap gambut",
  [ReportCategory.SEKAT_KANAL_KERING]: "Sekat kanal kering",
  [ReportCategory.AMAN_TERKENDALI]: "Aman / terkendali",
};

const AI_STATE_LABELS: Record<AIAnalysisStateValue, string> = {
  [AIAnalysisState.COMPLETED]: "Selesai",
  [AIAnalysisState.PENDING]: "Menunggu",
  [AIAnalysisState.FAILED]: "Gagal",
  [AIAnalysisState.SKIPPED]: "Tidak dianalisis",
};

function readableEnumFallback(value: string): string {
  return value.replaceAll("_", " ").toLocaleLowerCase("id-ID");
}

export function handlingStatusLabel(value: string | null | undefined): string {
  if (!value) return "Laporan dibuat";
  return (
    HANDLING_STATUS_LABELS[value as HandlingStatusValue] ??
    readableEnumFallback(value)
  );
}

export function reportUrgencyLabel(value: string | null | undefined): string {
  if (!value) return "Belum dinilai";
  return (
    URGENCY_LABELS[value as ReportUrgencyValue] ?? readableEnumFallback(value)
  );
}

export function reportCategoryLabel(value: string | null | undefined): string {
  if (!value) return "Belum diklasifikasikan";
  return (
    CATEGORY_LABELS[value as ReportCategoryValue] ?? readableEnumFallback(value)
  );
}

export function aiAnalysisStateLabel(value: string | null | undefined): string {
  if (!value) return "Belum dianalisis";
  return (
    AI_STATE_LABELS[value as AIAnalysisStateValue] ??
    readableEnumFallback(value)
  );
}
