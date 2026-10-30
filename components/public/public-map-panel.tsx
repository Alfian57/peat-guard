import { RefreshCw } from "lucide-react";

import {
  MapCanvasLoader,
  MapLoadingState,
} from "@/components/maps/map-canvas-loader";
import type { PublicLoadState } from "@/components/public/public-types";
import type { PublicMapData } from "@/lib/public/contracts";

export function PublicMapPanel({
  mapData,
  state,
  onRetry,
}: {
  mapData: PublicMapData | null;
  state: PublicLoadState;
  onRetry: () => void;
}) {
  const isEmpty =
    state === "ready" &&
    mapData !== null &&
    mapData.zones.length === 0 &&
    mapData.hotspots.length === 0;

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h3 className="font-heading text-3xl font-bold text-peat-forest sm:text-4xl">
            Peta pantauan publik
          </h3>
          <p className="mt-2 text-sm leading-6 text-peat-forest/70">
            Zona disetujui dan indikasi hotspot satelit.
          </p>
        </div>
        <p className="text-xs font-medium text-peat-forest/65">
          Hotspot bukan konfirmasi kejadian kebakaran.
        </p>
      </div>

      {state === "loading" ? (
        <MapLoadingState />
      ) : state === "error" ? (
        <div className="grid min-h-80 place-items-center rounded-2xl border border-red-900/15 bg-red-50 p-6 text-center">
          <div>
            <p className="font-heading text-2xl font-bold text-red-950">
              Peta belum dapat dimuat
            </p>
            <p className="mt-2 text-sm leading-6 text-red-950/80">
              Periksa koneksi lalu coba muat data publik kembali.
            </p>
            <button
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-peat-forest px-5 text-sm font-semibold text-white hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-peat-green"
              onClick={onRetry}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Coba lagi
            </button>
          </div>
        </div>
      ) : (
        <MapCanvasLoader
          className="h-[420px] overflow-hidden rounded-2xl border border-peat-forest/10 shadow-sm sm:h-[520px]"
          points={mapData?.hotspots ?? []}
          zones={mapData?.zones ?? []}
        />
      )}

      {isEmpty ? (
        <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm leading-6 text-peat-forest/75">
          Belum ada zona yang disetujui atau catatan hotspot untuk ditampilkan.
          Peta akan terisi saat data publik tersedia.
        </p>
      ) : null}

      {state === "ready" && mapData && !isEmpty ? (
        <ul
          aria-label="Legenda peta"
          className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-peat-forest/80"
        >
          <li className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 rounded-sm bg-peat-green"
            />
            Zona disetujui
          </li>
          <li className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-3 rounded-full bg-[#dc5a1b]"
            />
            Hotspot satelit
          </li>
          {mapData.hotspots.some((point) => point.isDemoData) ||
          mapData.zones.some((zone) => zone.isDemoData) ? (
            <li className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-full bg-peat-sun"
              />
              Data ilustrasi sintetis
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
