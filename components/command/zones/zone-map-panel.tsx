import { MapCanvasLoader } from "@/components/maps/map-canvas-loader";
import type { MapPoint, MapZone } from "@/lib/maps/types";

export function ZoneMapPanel({
  draftEditing,
  mapError,
  onMapClick,
  points,
  zones,
}: {
  draftEditing: boolean;
  mapError: string;
  onMapClick: (coordinates: [number, number]) => void;
  points: MapPoint[];
  zones: MapZone[];
}) {
  return (
    <section aria-label="Peta untuk menggambar batas zona" className="min-w-0">
      {mapError ? (
        <p
          className="mb-3 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-900"
          role="alert"
        >
          Peta atau konteks zona belum tersedia: {mapError}
        </p>
      ) : null}
      <MapCanvasLoader
        className="h-[clamp(300px,52vh,560px)] overflow-hidden rounded-xl"
        draftEditing={draftEditing}
        initialCenter={[113.9, -2.01]}
        initialZoom={6.5}
        maxAutoFitZoom={6.5}
        onMapClick={onMapClick}
        points={points}
        zones={zones}
      />
    </section>
  );
}
