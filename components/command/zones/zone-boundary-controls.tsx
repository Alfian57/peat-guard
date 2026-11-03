import { MapPinned, RotateCcw, Undo2 } from "lucide-react";

import {
  polygonFromVertices,
  polygonWithUpdatedOuterRing,
} from "@/components/command/zones/zone-geometry";
import type { ZonePolygon } from "@/lib/server/zones/validation";

export function ZoneBoundaryControls({
  drawBoundary,
  geometry,
  isCreate,
  movingVertex,
  onDrawBoundaryChange,
  onGeometryChange,
  onMovingVertexChange,
  vertices,
}: {
  drawBoundary: boolean;
  geometry: ZonePolygon | null;
  isCreate: boolean;
  movingVertex: number | null;
  onDrawBoundaryChange: (draw: boolean) => void;
  onGeometryChange: (geometry: ZonePolygon | null) => void;
  onMovingVertexChange: (vertex: number | null) => void;
  vertices: [number, number][];
}) {
  function undoLastVertex() {
    const remainingVertices = vertices.slice(0, -1);
    onGeometryChange(
      geometry
        ? polygonWithUpdatedOuterRing(geometry, remainingVertices)
        : polygonFromVertices(remainingVertices),
    );
  }

  return (
    <div className="rounded-xl border border-peat-forest/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-peat-forest">Batas zona</p>
          <p className="mt-1 text-xs leading-5 text-peat-forest/65">
            {vertices.length < 3
              ? "Klik peta untuk menambah titik (" +
                vertices.length +
                "/3 minimum)."
              : vertices.length + " titik · batas tertutup siap disimpan."}
          </p>
        </div>
        <MapPinned
          aria-hidden="true"
          className="shrink-0 text-peat-green"
          size={20}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={
            "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold " +
            (drawBoundary
              ? "bg-peat-green text-white"
              : "bg-secondary text-peat-forest")
          }
          onClick={() => {
            onMovingVertexChange(null);
            onDrawBoundaryChange(!drawBoundary);
          }}
          type="button"
        >
          <MapPinned aria-hidden="true" size={15} />
          {drawBoundary
            ? "Selesai menggambar"
            : isCreate
              ? "Gambar batas"
              : "Tambah titik batas"}
        </button>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-peat-forest/15 px-3 text-xs font-semibold text-peat-forest disabled:opacity-50"
          disabled={vertices.length === 0}
          onClick={() => onGeometryChange(null)}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={14} />
          Reset batas
        </button>
        {drawBoundary && vertices.length > 0 ? (
          <button
            aria-label="Batalkan titik terakhir"
            className="inline-grid min-h-11 min-w-11 place-items-center rounded-lg border border-peat-forest/15 text-peat-forest"
            onClick={undoLastVertex}
            type="button"
          >
            <Undo2 aria-hidden="true" size={15} />
          </button>
        ) : null}
      </div>

      {vertices.length > 0 && !isCreate ? (
        <ol
          aria-label="Titik batas zona"
          className="mt-3 max-h-44 space-y-1 overflow-y-auto border-t border-peat-forest/10 pt-2"
        >
          {vertices.map(([longitude, latitude], index) => (
            <li key={index + "-" + longitude + "-" + latitude}>
              <button
                className={
                  "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-2 text-left font-mono text-xs " +
                  (movingVertex === index
                    ? "bg-peat-sun/30 text-peat-forest"
                    : "text-peat-forest/70 hover:bg-peat-paper")
                }
                onClick={() => {
                  onDrawBoundaryChange(false);
                  onMovingVertexChange(index);
                }}
                type="button"
              >
                <span>Titik {index + 1}</span>
                <span>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      {movingVertex !== null ? (
        <p
          className="mt-2 text-xs font-semibold text-peat-forest"
          role="status"
        >
          Klik lokasi baru pada peta untuk memindahkan titik {movingVertex + 1}.
        </p>
      ) : null}
    </div>
  );
}
