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
    <div className="min-w-0 overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-sm">
      <div className="border-b border-peat-forest/10 px-4 py-3">
        <p className="font-semibold text-peat-forest">Pantauan wilayah</p>
        <p className="text-xs text-peat-forest/65">
          Hotspot satelit adalah indikasi dan perlu diverifikasi di lapangan.
        </p>
      </div>
      <div className="p-3 sm:p-4">
        {state === "loading" ? (
          <MapLoadingState className="h-[min(68vh,720px)] min-h-[440px] overflow-hidden rounded-xl" />
        ) : state === "error" ? (
          <CommandError message={error} onRetry={onRetry} />
        ) : (
          <MapCanvasLoader
            className="h-[min(68vh,720px)] min-h-[440px] overflow-hidden rounded-xl"
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
  );
}
