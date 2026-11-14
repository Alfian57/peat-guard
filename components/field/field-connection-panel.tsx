import {
  ChevronDown,
  CloudUpload,
  LoaderCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { FieldOwnerStatus } from "./field-app-shell";

export type FieldConnectionProps = {
  isConnected: boolean;
  isSyncing: boolean;
  ownerStatus: FieldOwnerStatus;
  queueCount: number;
  simulatedOffline: boolean;
  syncNow: () => Promise<unknown>;
  toggleSimulatedOffline: () => void;
};

export function FieldConnectionPanel({
  isConnected,
  isSyncing,
  ownerStatus,
  queueCount,
  simulatedOffline,
  syncNow,
  toggleSimulatedOffline,
}: FieldConnectionProps) {
  const status =
    ownerStatus === "loading"
      ? "Memeriksa sesi relawan…"
      : ownerStatus === "signed-out"
        ? "Masuk untuk menyimpan laporan"
        : ownerStatus === "unavailable"
          ? "Akun perangkat belum dikenali"
          : ownerStatus === "offline-known"
            ? "Offline · draf aman di perangkat"
            : isConnected
              ? "Terhubung ke posko"
              : "Offline · tersimpan di perangkat";
  return (
    <details className="group border-b border-peat-forest/10 bg-white">
      <summary className="mx-auto flex min-h-11 w-full max-w-[1600px] list-none items-center gap-2 px-4 text-xs text-peat-forest focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-peat-green sm:px-7 [&::-webkit-details-marker]:hidden">
        {isConnected ? (
          <Wifi aria-hidden="true" className="shrink-0" size={14} />
        ) : (
          <WifiOff
            aria-hidden="true"
            className="shrink-0 text-offline"
            size={14}
          />
        )}
        <span className="min-w-0 flex-1 leading-5" aria-live="polite">
          {ownerStatus === "loading" ? (
            <span className="flex h-5 items-center">
              <span className="sr-only">{status}</span>
              <span
                aria-hidden="true"
                className="h-3 w-32 animate-pulse rounded bg-peat-forest/10 motion-reduce:animate-none"
              />
            </span>
          ) : (
            status
          )}
        </span>
        {queueCount > 0 ? (
          <span className="shrink-0 text-muted-foreground">
            {queueCount} menunggu
          </span>
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          size={14}
        />
      </summary>
      <div className="mx-auto w-full max-w-[1600px] space-y-3 border-t border-peat-forest/10 px-4 py-3 sm:px-7">
        <p className="text-xs leading-5 text-muted-foreground">
          Laporan tersimpan di perangkat. Pengiriman ke posko memerlukan koneksi
          dan sesi relawan aktif.
        </p>
        {queueCount > 0 ? (
          <button
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-peat-forest px-4 text-xs font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
            disabled={
              isSyncing || !isConnected || ownerStatus !== "authenticated"
            }
            onClick={() => void syncNow()}
            type="button"
          >
            {isSyncing ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
                size={15}
              />
            ) : (
              <CloudUpload aria-hidden="true" size={15} />
            )}
            {isSyncing ? "Menyinkronkan…" : "Kirim ke posko"}
          </button>
        ) : null}
        <button
          aria-label="Simulasikan mode offline"
          aria-pressed={simulatedOffline}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-peat-forest/10 px-3 text-xs text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
          onClick={toggleSimulatedOffline}
          type="button"
        >
          <span>Simulasi offline</span>
          <span
            aria-hidden="true"
            className={
              "rounded-full px-2 py-1 font-semibold " +
              (simulatedOffline
                ? "bg-offline/10 text-peat-forest"
                : "bg-peat-paper text-muted-foreground")
            }
          >
            {simulatedOffline ? "Aktif" : "Nonaktif"}
          </span>
        </button>
      </div>
    </details>
  );
}
