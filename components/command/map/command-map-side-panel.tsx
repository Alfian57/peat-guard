import { LayerCheckbox } from "@/components/command/map/layer-checkbox";
import { MapInspector } from "@/components/command/map/map-inspector";
import { MapFirmsStatus } from "@/components/command/map/map-firms-status";
import {
  ReportMapControls,
  type ReportMapControlsProps,
} from "@/components/command/map/report-map-controls";
import type { FirmsSyncStatus } from "@/components/command/command-api";
import type { MapPoint, MapZone } from "@/lib/maps/types";

export function CommandMapSidePanel({
  firmsError,
  firmsNotice,
  firmsStatus,
  hotspotCount,
  onSync,
  selectedPoint,
  selectedZone,
  setShowHotspots,
  setShowWaterPoints,
  setShowZones,
  showHotspots,
  showWaterPoints,
  showZones,
  syncing,
  waterPointCount,
  zoneCount,
  reportControls,
}: {
  firmsError: string;
  firmsNotice: string;
  firmsStatus: FirmsSyncStatus | null;
  hotspotCount: number | undefined;
  onSync: () => void;
  selectedPoint: MapPoint | null;
  selectedZone: MapZone | null;
  setShowHotspots: (show: boolean) => void;
  setShowWaterPoints: (show: boolean) => void;
  setShowZones: (show: boolean) => void;
  showHotspots: boolean;
  showWaterPoints: boolean;
  showZones: boolean;
  syncing: boolean;
  waterPointCount: number | undefined;
  zoneCount: number | undefined;
  reportControls: ReportMapControlsProps;
}) {
  return (
    <aside
      aria-label="Kontrol dan informasi peta"
      className="flex min-w-0 flex-col gap-5 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs"
    >
      <section aria-labelledby="map-layers-heading">
        <h2
          className="font-heading text-2xl font-bold text-peat-forest"
          id="map-layers-heading"
        >
          Layer peta
        </h2>
        <div className="mt-2">
          <LayerCheckbox
            checked={showZones}
            count={zoneCount}
            label="Zona gambut"
            onChange={setShowZones}
            swatch="bg-peat-green"
          />
          <LayerCheckbox
            checked={showWaterPoints}
            count={waterPointCount}
            label="Titik sumber air"
            onChange={setShowWaterPoints}
            swatch="bg-sky-700"
          />
          <LayerCheckbox
            checked={showHotspots}
            count={hotspotCount}
            label="Hotspot satelit"
            onChange={setShowHotspots}
            swatch="bg-orange-700"
          />
        </div>
      </section>
      <ReportMapControls {...reportControls} />
      <div className="border-t border-peat-forest/10 pt-5">
        <MapInspector point={selectedPoint} zone={selectedZone} />
      </div>
      <MapFirmsStatus
        error={firmsError}
        notice={firmsNotice}
        onSync={onSync}
        status={firmsStatus}
        syncing={syncing}
      />
    </aside>
  );
}
