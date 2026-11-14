import { ChevronDown, Satellite } from "lucide-react";

import type { FirmsSyncStatus } from "@/components/command/command-api";
import { hotspotSourceLabel } from "@/lib/firms-labels";

const FRESHNESS_LABELS: Record<FirmsSyncStatus["freshness"], string> = {
  fresh: "Data terkini",
  partial: "Pembaruan parsial",
  stale: "Data tertinggal",
  unavailable: "Belum tersinkron",
  not_configured: "Belum dikonfigurasi",
  configuration_error: "Konfigurasi bermasalah",
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function MapFirmsStatus({
  error,
  notice,
  onSync,
  status,
  syncing,
}: {
  error: string;
  notice: string;
  onSync: () => void;
  status: FirmsSyncStatus | null;
  syncing: boolean;
}) {
  return (
    <section
      aria-label="Sinkronisasi NASA FIRMS"
      className="mt-auto border-t border-peat-forest/10 pt-3"
    >
      <details className="group">
        <summary className="flex min-h-11 list-none flex-wrap items-center gap-2 rounded-lg text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green [&::-webkit-details-marker]:hidden">
          <span className="font-semibold text-peat-forest">NASA FIRMS</span>
          <span className="ml-auto text-muted-foreground">
            {status
              ? FRESHNESS_LABELS[status.freshness]
              : error
                ? "Status tidak tersedia"
                : "Memuat status…"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
            size={14}
          />
        </summary>
        <p className="mt-1 mb-3 text-xs leading-5 text-muted-foreground">
          {status?.lastDataSyncAt
            ? "Data diperbarui " +
              formatDate(status.lastDataSyncAt) +
              " · " +
              status.storedHotspotCount +
              " hotspot tersimpan."
            : status?.configured
              ? "Belum ada sinkronisasi berhasil."
              : status
                ? "Kunci NASA FIRMS belum tersedia; data yang sudah tersimpan tetap terlihat."
                : error
                  ? "Status sinkronisasi belum dapat dimuat. Coba lagi nanti."
                  : "Status sinkronisasi sedang dimuat."}
        </p>
        {status?.freshness === "partial" &&
        status.lastFailedSources.length > 0 ? (
          <p className="mb-3 text-xs leading-5 text-amber-900" role="status">
            Sumber belum tersedia:{" "}
            {status.lastFailedSources.map(hotspotSourceLabel).join(", ")}.
          </p>
        ) : null}
        {status?.lastOutcome === "failed" && status.lastErrorCode ? (
          <p className="mb-3 text-xs leading-5 text-red-800" role="status">
            Sinkronisasi terakhir gagal ({status.lastErrorCode}); data tersimpan
            tetap ditampilkan.
          </p>
        ) : null}
        {status?.freshness === "configuration_error" ? (
          <p className="mb-3 text-xs leading-5 text-red-800" role="status">
            Interval NASA FIRMS tidak valid. Periksa konfigurasi worker.
          </p>
        ) : null}
      </details>
      {error ? (
        <p className="mb-3 text-xs leading-5 text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mb-3 text-xs leading-5 text-peat-forest/75" role="status">
          {notice}
        </p>
      ) : null}
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-peat-forest/15 px-3 text-xs font-semibold text-peat-forest transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-60"
        disabled={
          syncing ||
          status?.configured === false ||
          status?.freshness === "configuration_error"
        }
        onClick={onSync}
        type="button"
      >
        <Satellite aria-hidden="true" size={15} />
        {syncing ? "Menyinkronkan…" : "Sinkronkan NASA FIRMS"}
      </button>
    </section>
  );
}
