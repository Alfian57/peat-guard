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
    <div className="public-map__panel">
      <div className="public-map__toolbar">
        <h3>Peta pantauan publik</h3>
        <span>Zona & hotspot satelit</span>
      </div>
      <div className="public-map__viewport">
        {state === "loading" ? (
          <div className="public-map__canvas">
            <MapLoadingState />
          </div>
        ) : state === "error" ? (
          <div className="public-map__canvas grid place-items-center bg-red-50 p-6 text-center">
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
            autoFit
            className="public-map__canvas w-full overflow-hidden"
            clusterPoints={false}
            initialCenter={[113.9, -2.01]}
            initialZoom={6.5}
            maxAutoFitZoom={6.5}
            points={mapData?.hotspots ?? []}
            zones={mapData?.zones ?? []}
          />
        )}
      </div>

      {isEmpty ? (
        <p className="public-map__empty">
          Belum ada zona yang disetujui atau hotspot satelit untuk ditampilkan.
          Peta akan terisi saat data publik tersedia.
        </p>
      ) : null}

      {state === "ready" && mapData && !isEmpty ? (
        <ul aria-label="Legenda peta" className="public-map__legend">
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
