import { ChevronDown, MapPinned, RotateCcw, Undo2 } from "lucide-react";

export function ZoneBoundaryControls({
  disabled = false,
  drawBoundary,
  isCreate,
  movingVertex,
  onDrawBoundaryChange,
  onReset,
  onUndo,
  onMovingVertexChange,
  vertices,
}: {
  disabled?: boolean;
  drawBoundary: boolean;
  isCreate: boolean;
  movingVertex: number | null;
  onDrawBoundaryChange: (draw: boolean) => void;
  onReset: () => void;
  onUndo: () => void;
  onMovingVertexChange: (vertex: number | null) => void;
  vertices: [number, number][];
}) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-heading text-2xl font-bold text-peat-forest">
          Batas zona
        </h2>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {vertices.length < 3
            ? vertices.length + "/3 titik minimum"
            : vertices.length + " titik · batas tertutup"}
        </p>
      </div>
      <fieldset className="mt-3 min-w-0" disabled={disabled}>
        <legend className="sr-only">Alat gambar batas zona</legend>
        <div className="flex flex-wrap gap-2">
          <button
            aria-pressed={drawBoundary}
            className={
              "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-50 " +
              (drawBoundary
                ? "bg-peat-green text-white"
                : "bg-secondary text-peat-forest hover:bg-peat-forest/10")
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
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-peat-forest/15 px-3 text-xs font-semibold text-peat-forest transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-50"
            disabled={vertices.length === 0}
            onClick={onReset}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={14} />
            Reset batas
          </button>
          {drawBoundary && vertices.length > 0 ? (
            <button
              aria-label="Batalkan titik terakhir"
              className="inline-grid min-h-11 min-w-11 place-items-center rounded-xl border border-peat-forest/15 text-peat-forest transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
              onClick={onUndo}
              type="button"
            >
              <Undo2 aria-hidden="true" size={15} />
            </button>
          ) : null}
        </div>
        {vertices.length > 0 && !isCreate ? (
          <details className="group mt-2">
            <summary className="flex min-h-11 list-none items-center gap-2 rounded-lg text-xs font-semibold text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green [&::-webkit-details-marker]:hidden">
              Koordinat titik batas
              <ChevronDown
                aria-hidden="true"
                className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                size={14}
              />
            </summary>
            <ol
              aria-label="Titik batas zona"
              className="max-h-44 space-y-1 overflow-y-auto overscroll-contain rounded-xl border border-peat-forest/10 p-2"
            >
              {vertices.map(([longitude, latitude], index) => (
                <li key={index + "-" + longitude + "-" + latitude}>
                  <button
                    aria-pressed={movingVertex === index}
                    className={
                      "flex min-h-11 w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg px-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green " +
                      (movingVertex === index
                        ? "bg-peat-sun/20 text-peat-forest"
                        : "text-muted-foreground hover:bg-peat-paper")
                    }
                    onClick={() => {
                      onDrawBoundaryChange(false);
                      onMovingVertexChange(index);
                    }}
                    type="button"
                  >
                    <span>Titik {index + 1}</span>
                    <span className="font-mono">
                      {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </details>
        ) : null}
      </fieldset>
      <p
        className="mt-3 text-xs leading-5 text-muted-foreground"
        role={movingVertex !== null ? "status" : undefined}
      >
        {movingVertex !== null
          ? "Klik lokasi baru pada peta untuk memindahkan titik " +
            (movingVertex + 1) +
            "."
          : drawBoundary
            ? "Klik peta untuk menambah titik. Gunakan sedikitnya tiga titik untuk membentuk batas."
            : isCreate
              ? "Aktifkan Gambar batas, lalu klik titik-titik batas pada peta."
              : "Tambah titik atau buka koordinat untuk memindahkan titik batas."}
      </p>
    </div>
  );
}
