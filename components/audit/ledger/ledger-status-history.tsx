import type { MrvLedgerRow } from "@/lib/server/mrv/contracts";
import { formatDateTime } from "../audit-formatters";

const handlingStatusLabels: Record<string, string> = {
  DALAM_PENANGANAN: "Ditangani",
  MENUNGGU_TINDAKAN: "Menunggu",
  SELESAI: "Selesai",
};

function statusLabel(status: string | null): string {
  if (!status) return "Laporan dibuat";
  return handlingStatusLabels[status] ?? status.replaceAll("_", " ");
}

export function LedgerStatusHistory({ row }: { row: MrvLedgerRow }) {
  return (
    <details className="mt-2 max-w-52 rounded-lg border border-border bg-white px-2.5 py-2 text-xs">
      <summary className="min-h-8 cursor-pointer font-semibold text-peat-green">
        Riwayat status ({row.statusHistory.length})
      </summary>
      {row.statusHistory.length > 0 ? (
        <ol className="mt-2 space-y-2 border-l border-peat-green/20 pl-3">
          {row.statusHistory.map((event) => (
            <li key={event.eventId}>
              <time
                className="block text-muted-foreground"
                dateTime={event.createdAt}
              >
                {formatDateTime(event.createdAt)} · {event.actorRole}
              </time>
              <span className="font-semibold text-peat-forest">
                {statusLabel(event.previousStatus)} →{" "}
                {statusLabel(event.nextStatus)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-muted-foreground">
          Belum ada perubahan status.
        </p>
      )}
    </details>
  );
}
