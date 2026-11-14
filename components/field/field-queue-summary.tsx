import { CloudUpload, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function FieldQueueSummary({
  hasOwner,
  isConnected,
  isSyncing,
  waitingCount,
  sentCount,
  onSync,
  isLoading = false,
}: {
  hasOwner: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  waitingCount: number;
  sentCount: number;
  onSync: () => Promise<void>;
  isLoading?: boolean;
}) {
  return (
    <section
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-peat-forest/10 bg-white px-4 py-3 shadow-xs"
      aria-labelledby="queue-status-title"
    >
      <div>
        <div className="flex items-center gap-2.5">
          <CloudUpload
            aria-hidden="true"
            className="shrink-0 text-peat-green"
            size={20}
          />
          {!hasOwner && isLoading ? (
            <>
              <h2 id="queue-status-title" className="sr-only">
                Ringkasan antrean
              </h2>
              <Skeleton
                aria-hidden="true"
                className="h-4 w-32 bg-peat-forest/10 motion-reduce:animate-none"
              />
            </>
          ) : (
            <h2
              id="queue-status-title"
              className="text-sm font-semibold text-peat-forest"
            >
              {!hasOwner
                ? "Akun belum diverifikasi"
                : isConnected
                  ? "Koneksi tersedia"
                  : "Sedang offline"}
            </h2>
          )}
        </div>
        {isLoading ? (
          <Skeleton
            role="status"
            aria-label="Memuat ringkasan antrean"
            className="mt-1 h-5 w-48 max-w-full bg-peat-forest/10 motion-reduce:animate-none"
          />
        ) : (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {hasOwner
              ? `${waitingCount} menunggu · ${sentCount} terkirim ke posko`
              : "Antrean disembunyikan sampai pemilik terverifikasi"}
          </p>
        )}
        {!isLoading && hasOwner && !isConnected && waitingCount > 0 ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Pengiriman dilanjutkan saat koneksi tersedia.
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={
          isLoading ||
          !hasOwner ||
          !isConnected ||
          isSyncing ||
          waitingCount === 0
        }
        onClick={() => void onSync()}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-peat-forest px-3 text-xs font-semibold text-white transition hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-forest disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        <RefreshCw
          aria-hidden="true"
          className={isSyncing ? "animate-spin motion-reduce:animate-none" : ""}
          size={16}
        />
        {isSyncing ? "Menyinkronkan…" : "Sinkronkan semua"}
      </button>
    </section>
  );
}
