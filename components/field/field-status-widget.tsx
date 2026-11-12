import { CloudUpload, LoaderCircle, Wifi, WifiOff } from "lucide-react";

import type { FieldOwnerStatus } from "./field-app-shell";

export function FieldStatusWidget({
  isConnected,
  simulatedOffline,
  toggleSimulatedOffline,
  queueCount,
  isSyncing,
  syncNow,
  ownerStatus,
}: {
  isConnected: boolean;
  simulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  queueCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<unknown>;
  ownerStatus: FieldOwnerStatus;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-white">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 font-medium">
          {isConnected ? (
            <Wifi aria-hidden="true" className="text-peat-leaf" size={15} />
          ) : (
            <WifiOff aria-hidden="true" className="text-offline" size={15} />
          )}
          <span>{isConnected ? "Terhubung ke posko" : "Mode offline"}</span>
        </span>
        <span
          className={`size-2 shrink-0 rounded-full ${isConnected ? "bg-peat-leaf" : "bg-offline"}`}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/80">
        <span>Simulasi offline</span>
        <button
          aria-label="Simulasikan mode offline"
          aria-pressed={simulatedOffline}
          className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-sun ${
            simulatedOffline ? "bg-offline" : "bg-white/30"
          }`}
          onClick={toggleSimulatedOffline}
          type="button"
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow-xs transition-transform ${
              simulatedOffline ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {queueCount > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/75">Antrean lokal</span>
            <span className="rounded-full bg-offline px-2 py-0.5 font-bold text-white">
              {queueCount}
            </span>
          </div>
          <button
            className="mt-2.5 flex min-h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-peat-leaf px-3 text-xs font-semibold text-peat-forest transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
            disabled={
              isSyncing || !isConnected || ownerStatus !== "authenticated"
            }
            onClick={() => void syncNow()}
            type="button"
          >
            {isSyncing ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={14}
              />
            ) : (
              <CloudUpload aria-hidden="true" size={14} />
            )}
            {isSyncing ? "Menyinkronkan…" : "Kirim ke posko"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
