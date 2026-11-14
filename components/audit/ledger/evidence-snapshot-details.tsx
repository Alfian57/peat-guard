import type { MrvLedgerAuditEntry } from "@/lib/server/mrv/contracts";
import {
  aiAnalysisStateLabel,
  reportCategoryLabel,
  reportUrgencyLabel,
} from "@/lib/report-labels";
import { formatDateTime, formatDecimal } from "../audit-formatters";

export function EvidenceSnapshotDetails({
  event,
}: {
  event: MrvLedgerAuditEntry;
}) {
  const snapshot = event.evidenceSnapshot;

  if (!snapshot) return null;

  return (
    <dl className="mt-2 grid gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
      <dt className="text-muted-foreground">Koordinat tersimpan</dt>
      <dd className="font-mono text-peat-forest">
        {snapshot.latitude.toFixed(4)}, {snapshot.longitude.toFixed(4)}
      </dd>
      <dt className="text-muted-foreground">Akurasi perangkat</dt>
      <dd className="text-peat-forest">
        {snapshot.accuracyMeters === null
          ? "Belum tersedia"
          : `${formatDecimal(snapshot.accuracyMeters)} m`}
      </dd>
      <dt className="text-muted-foreground">Foto</dt>
      <dd className="text-peat-forest">
        {snapshot.photoPresent ? "Tersimpan" : "Tidak tersedia"}
        {snapshot.photoSha256 ? (
          <span className="mt-0.5 block font-mono text-[0.65rem] break-all text-muted-foreground">
            SHA-256 {snapshot.photoSha256}
          </span>
        ) : null}
      </dd>
      <dt className="text-muted-foreground">Triase saat dicatat</dt>
      <dd className="text-peat-forest">
        {aiAnalysisStateLabel(snapshot.aiState)}
        {` · ${reportCategoryLabel(snapshot.aiCategory)}`}
        {` · ${reportUrgencyLabel(snapshot.aiUrgency)}`}
      </dd>
      <dt className="text-muted-foreground">Waktu kejadian / sinkronisasi</dt>
      <dd className="text-peat-forest">
        {formatDateTime(snapshot.capturedAt)} /{" "}
        {formatDateTime(snapshot.syncedAt)}
      </dd>
    </dl>
  );
}
