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
    <section
      aria-label="Peta untuk menggambar batas zona"
      className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white p-3 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="font-heading text-2xl font-bold text-peat-forest">
            Gambar di peta
          </h2>
          <p className="text-xs text-peat-forest/65">
            Klik peta saat mode gambar atau pemindahan titik aktif.
          </p>
        </div>
        {draftEditing ? (
          <span className="rounded-full bg-peat-sun/30 px-3 py-1 text-xs font-semibold text-peat-forest">
            Mode edit aktif
          </span>
        ) : null}
      </div>
      {mapError ? (
        <p
          className="mb-3 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-900"
          role="alert"
        >
          Peta atau konteks zona belum tersedia: {mapError}
        </p>
      ) : null}
      <MapCanvasLoader
        className="h-[min(68vh,760px)] min-h-[480px] overflow-hidden rounded-xl"
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
