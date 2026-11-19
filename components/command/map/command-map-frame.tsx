import { CommandError } from "@/components/command/command-feedback";
import {
  MapCanvasLoader,
  MapLoadingState,
} from "@/components/maps/map-canvas-loader";
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
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-peat-forest/10 bg-white p-2 shadow-xs sm:p-3">
      <div className="relative h-[clamp(280px,52dvh,630px)] overflow-hidden rounded-xl sm:h-[clamp(320px,60dvh,720px)] xl:h-auto xl:min-h-[clamp(320px,68vh,720px)] xl:flex-1">
        {state === "ready" && error ? (
          <p
            className="absolute top-3 left-3 z-10 max-w-sm rounded-lg border border-amber-900/15 bg-white/95 px-3 py-2 text-xs leading-5 text-amber-950 shadow-sm"
            role="status"
          >
            Pembaruan peta gagal. Data terakhir tetap ditampilkan.
          </p>
        ) : null}
        <div className="absolute inset-0">
          {state === "loading" ? (
            <MapLoadingState className="flex h-full flex-col justify-between overflow-hidden rounded-xl bg-peat-paper p-4" />
          ) : state === "error" ? (
            <CommandError message={error} onRetry={onRetry} />
          ) : (
            <MapCanvasLoader
              className="h-full overflow-hidden rounded-xl"
              initialCenter={[113.9, -2.01]}
              initialZoom={6.5}
              maxAutoFitZoom={6.5}
              onPointSelect={onPointSelect}
              onViewportChange={onViewportChange}
              onZoneSelect={onZoneSelect}
              points={points}
              zones={zones}
            />
          )}
        </div>
      </div>
      <p className="shrink-0 px-2 pt-3 pb-1 text-xs leading-5 text-muted-foreground">
        Hotspot satelit adalah indikasi dan perlu diverifikasi di lapangan.
      </p>
    </div>
  );
}
