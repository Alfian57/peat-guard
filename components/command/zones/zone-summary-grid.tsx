import { Droplets, Leaf, MapPinned } from "lucide-react";

import { ZoneSummaryCard } from "@/components/command/zones/zone-summary-card";

export function ZoneSummaryGrid({
  areaHectares,
  totalZones,
  waterPoints,
}: {
  areaHectares: number;
  totalZones: number;
  waterPoints: number;
}) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <ZoneSummaryCard
        icon={<Leaf aria-hidden="true" size={18} />}
        label="Total zona"
        value={formatNumber(totalZones)}
      />
      <ZoneSummaryCard
        icon={<MapPinned aria-hidden="true" size={18} />}
        label="Total luas zona"
        value={formatNumber(areaHectares, 1) + " ha"}
      />
      <ZoneSummaryCard
        icon={<Droplets aria-hidden="true" size={18} />}
        label="Titik sumber air"
        value={formatNumber(waterPoints)}
      />
    </div>
  );
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(
    value,
  );
}
