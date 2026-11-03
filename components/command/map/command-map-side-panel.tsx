import { LayerCheckbox } from "@/components/command/map/layer-checkbox";
import { MapInspector } from "@/components/command/map/map-inspector";
import {
  ReportMapControls,
  type ReportMapControlsProps,
} from "@/components/command/map/report-map-controls";
import type { FirmsSyncStatus } from "@/components/command/command-api";
import type { MapPoint, MapZone } from "@/lib/maps/types";

export function CommandMapSidePanel({
  firmsError,
  firmsStatus,
  selectedPoint,
  selectedZone,
  setShowHotspots,
  setShowWaterPoints,
  setShowZones,
  showHotspots,
  showWaterPoints,
  showZones,
  reportControls,
}: {
  firmsError: string;
  firmsStatus: FirmsSyncStatus | null;
  selectedPoint: MapPoint | null;
  selectedZone: MapZone | null;
  setShowHotspots: (show: boolean) => void;
  setShowWaterPoints: (show: boolean) => void;
  setShowZones: (show: boolean) => void;
  showHotspots: boolean;
  showWaterPoints: boolean;
  showZones: boolean;
  reportControls: ReportMapControlsProps;
}) {
  return (
    <aside className="space-y-4">
      <section
        aria-labelledby="map-layers-heading"
        className="rounded-2xl border border-peat-forest/10 bg-white p-4"
      >
        <h2
          className="font-heading text-2xl font-bold text-peat-forest"
          id="map-layers-heading"
        >
          Layer peta
        </h2>
        <div className="mt-3 space-y-3">
          <LayerCheckbox
            checked={showZones}
            label="Zona gambut"
            onChange={setShowZones}
            swatch="bg-peat-green"
          />
          <LayerCheckbox
            checked={showWaterPoints}
            label="Titik sumber air"
            onChange={setShowWaterPoints}
            swatch="bg-sky-700"
          />
          <LayerCheckbox
            checked={showHotspots}
            label="Hotspot satelit"
            onChange={setShowHotspots}
            swatch="bg-orange-700"
          />
        </div>
      </section>

      <MapInspector point={selectedPoint} zone={selectedZone} />

      <section className="rounded-2xl border border-peat-forest/10 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-bold text-peat-forest">
            NASA FIRMS
          </h2>
          {firmsStatus ? (
            <span
              className={
                "rounded-full px-2.5 py-1 text-xs font-semibold " +
                (firmsStatus.configured
                  ? "bg-safe/10 text-safe"
                  : "bg-peat-sun/25 text-peat-forest")
              }
            >
              {firmsStatus.configured ? "Terhubung" : "Belum dikonfigurasi"}
            </span>
          ) : null}
        </div>
        {firmsError ? (
          <p className="mt-2 text-sm leading-5 text-red-800">{firmsError}</p>
        ) : (
          <p className="mt-2 text-sm leading-5 text-peat-forest/70">
            {firmsStatus?.lastSuccessfulAt
              ? "Sinkron terakhir " +
                formatDate(firmsStatus.lastSuccessfulAt) +
                " · " +
                firmsStatus.storedHotspotCount +
                " hotspot tersimpan."
              : firmsStatus?.configured
                ? "Belum ada sinkronisasi berhasil."
                : "Kunci NASA FIRMS belum tersedia; data yang sudah tersimpan tetap terlihat."}
          </p>
        )}
      </section>

      <ReportMapControls {...reportControls} />
    </aside>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
