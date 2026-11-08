import { ShieldAlert } from "lucide-react";
import type { MrvLedgerRow } from "@/lib/server/mrv/contracts";
import { formatDecimal } from "../audit-formatters";

const aiCategoryLabels: Record<string, string> = {
  API_AKTIF: "Api aktif",
  AMAN_TERKENDALI: "Aman terkendali",
  ASAP_GAMBUT: "Asap gambut",
  SEKAT_KANAL_KERING: "Sekat kanal kering",
};

const aiUrgencyLabels: Record<string, string> = {
  KRITIS: "Kritis",
  RENDAH: "Rendah",
  WASPADA: "Waspada",
};

const aiStateLabels: Record<string, string> = {
  COMPLETED: "Selesai",
  FAILED: "Gagal",
  PENDING: "Menunggu",
  SKIPPED: "Tidak dianalisis",
};

export function LedgerAiTriage({ row }: { row: MrvLedgerRow }) {
  const category = row.aiTriage.category;
  const urgency = row.aiTriage.urgency;
  const confidence = row.aiTriage.confidence;

  return (
    <div className="min-w-36">
      <p className="font-semibold text-peat-forest">
        {category
          ? (aiCategoryLabels[category] ?? category)
          : "Belum ada klasifikasi"}
      </p>
      {urgency ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldAlert aria-hidden="true" size={13} />
          {aiUrgencyLabels[urgency] ?? urgency}
          {confidence !== null ? ` · ${formatDecimal(confidence * 100)}%` : ""}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">
        Triase: {aiStateLabels[row.aiTriage.state ?? ""] ?? "Belum tersedia"}
      </p>
    </div>
  );
}
