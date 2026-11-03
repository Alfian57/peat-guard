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
      <SummaryCard label="Zona gambut" value={formatCount(zoneCount)} />
      <SummaryCard
        label="Titik sumber air"
        value={formatCount(waterPointCount)}
      />
      <SummaryCard label="Hotspot satelit" value={formatCount(hotspotCount)} />
      <SummaryCard
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-peat-forest/10 bg-white px-4 py-3">
      <p className="text-xs font-medium text-peat-forest/65">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold text-peat-forest">
        {value}
      </p>
    </div>
  );
}

function formatCount(value: number | undefined, truncated = false): string {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("id-ID").format(value) + (truncated ? "+" : "");
}
