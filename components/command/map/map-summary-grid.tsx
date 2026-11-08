import { MapSummaryCard } from "./map-summary-card";

export function MapSummaryGrid({
  hotspotCount,
  reportCount,
  reportTruncated,
  waterPointCount,
  zoneCount,
}: {
  hotspotCount: number | undefined;
  reportCount: number | undefined;
  reportTruncated: boolean;
  waterPointCount: number | undefined;
  zoneCount: number | undefined;
}) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MapSummaryCard label="Zona gambut" value={formatCount(zoneCount)} />
      <MapSummaryCard
        label="Titik sumber air"
        value={formatCount(waterPointCount)}
      />
      <MapSummaryCard
        label="Hotspot satelit"
        value={formatCount(hotspotCount)}
      />
      <MapSummaryCard
        label="Laporan pada area peta"
        value={
          reportCount === undefined
            ? "—"
            : formatCount(reportCount, reportTruncated)
        }
      />
    </div>
  );
}

function formatCount(value: number | undefined, truncated = false): string {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("id-ID").format(value) + (truncated ? "+" : "");
}
