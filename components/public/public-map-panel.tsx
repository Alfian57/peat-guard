import { RefreshCw } from "lucide-react";

import {
  MapCanvasLoader,
  MapLoadingState,
} from "@/components/maps/map-canvas-loader";
import type { PublicLoadState } from "@/components/public/public-types";
import type { PublicMapViewData } from "@/lib/public/client-contracts";

export function PublicMapPanel({
  mapData,
  state,
  onRetry,
}: {
  mapData: PublicMapViewData | null;
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
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h3 className="font-heading text-3xl font-bold text-peat-forest sm:text-4xl lg:text-5xl">
            Peta pantauan publik
          </h3>
          <p className="mt-2 text-sm leading-6 text-peat-forest/70 sm:text-base">
            Zona disetujui dan indikasi hotspot satelit.
          </p>
        </div>
        <p className="text-xs font-medium text-peat-forest/65 sm:text-sm">
          Hotspot bukan konfirmasi kejadian kebakaran.
        </p>
      </div>

      {state === "loading" ? (
        <div className="h-[480px] sm:h-[580px] lg:h-[640px]">
          <MapLoadingState />
        </div>
      ) : state === "error" ? (
        <div className="grid min-h-[480px] place-items-center rounded-2xl border border-red-900/15 bg-red-50 p-6 text-center sm:min-h-[580px] lg:min-h-[640px]">
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
          className="h-[480px] w-full overflow-hidden rounded-2xl border border-peat-forest/10 shadow-sm sm:h-[580px] lg:h-[640px]"
          clusterPoints={false}
          points={mapData?.hotspots ?? []}
          zones={mapData?.zones ?? []}
        />
      )}

      {isEmpty ? (
        <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm leading-6 text-peat-forest/75">
          Belum ada zona yang disetujui atau hotspot satelit untuk ditampilkan.
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
          {mapData.zones.some((zone) => zone.isDemoData) ? (
            <li className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-sm border border-peat-sun bg-peat-sun"
              />
              Zona ilustrasi sintetis
            </li>
          ) : null}
          {mapData.hotspots.some((point) => point.isDemoData) ? (
            <li className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-full border-2 border-[#dc5a1b] bg-peat-sun"
              />
              Hotspot ilustrasi sintetis
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
