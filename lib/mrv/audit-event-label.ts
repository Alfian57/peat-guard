import type { MrvLedgerAuditEntry } from "@/lib/server/mrv/contracts";

const AUDIT_EVENT_LABELS: Record<MrvLedgerAuditEntry["eventType"], string> = {
  MRV_EVIDENCE_REVIEWED: "Bukti ditinjau",
  REPORT_AI_ANALYSIS_COMPLETED: "Hasil triase AI dicatat",
  REPORT_AI_ANALYSIS_FAILED: "Kegagalan triase AI dicatat",
  REPORT_EVIDENCE_RECORDED: "Bukti awal dicatat",
};

export function mrvAuditEventLabel(eventType: string): string {
  return (
    AUDIT_EVENT_LABELS[eventType as MrvLedgerAuditEntry["eventType"]] ??
    "Peristiwa audit MRV"
  );
}
