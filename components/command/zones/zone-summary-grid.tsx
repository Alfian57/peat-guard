import { Droplets, Leaf, MapPinned } from "lucide-react";

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
      <Summary
        icon={<Leaf aria-hidden="true" size={18} />}
        label="Total zona"
        value={formatNumber(totalZones)}
      />
      <Summary
        icon={<MapPinned aria-hidden="true" size={18} />}
        label="Luas terdaftar"
        value={formatNumber(areaHectares, 1) + " ha"}
      />
      <Summary
        icon={<Droplets aria-hidden="true" size={18} />}
        label="Titik sumber air"
        value={formatNumber(waterPoints)}
      />
    </div>
  );
}

function Summary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-peat-forest/10 bg-white p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-peat-forest">
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium text-peat-forest/65">{label}</p>
        <p className="mt-0.5 font-heading text-2xl font-bold text-peat-forest">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits }).format(
    value,
  );
}
