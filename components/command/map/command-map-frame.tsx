import { RefreshCw } from "lucide-react";

import {
  CommandError,
  CommandLoading,
} from "@/components/command/command-feedback";
import { MapCanvasLoader } from "@/components/maps/map-canvas-loader";
import type { MapPoint, MapViewport, MapZone } from "@/lib/maps/types";

export function CommandMapFrame({
  error,
  onPointSelect,
  onRetry,
  onViewportChange,
  onZoneSelect,
  points,
  state,
  zones,
}: {
  error: string;
  onPointSelect: (point: MapPoint) => void;
  onRetry: () => void;
  onViewportChange: (viewport: MapViewport) => void;
  onZoneSelect: (zone: MapZone) => void;
  points: MapPoint[];
  state: "loading" | "ready" | "error";
  zones: MapZone[];
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-peat-forest/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-peat-forest">Pantauan wilayah</p>
          <p className="text-xs text-peat-forest/65">
            Hotspot satelit adalah indikasi dan perlu diverifikasi di lapangan.
          </p>
        </div>
        <button
          aria-label="Muat ulang data peta"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest hover:bg-peat-forest/5"
          disabled={state === "loading"}
          onClick={onRetry}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={15} />
          Muat ulang
        </button>
      </div>
      <div className="p-3 sm:p-4">
        {state === "loading" ? (
          <CommandLoading label="Memuat data peta komando…" />
        ) : state === "error" ? (
          <CommandError message={error} onRetry={onRetry} />
        ) : (
          <MapCanvasLoader
            className="h-[min(68vh,720px)] min-h-[440px] overflow-hidden rounded-xl"
            onPointSelect={onPointSelect}
            onViewportChange={onViewportChange}
            onZoneSelect={onZoneSelect}
            points={points}
            zones={zones}
          />
        )}
      </div>
    </div>
  );
}
