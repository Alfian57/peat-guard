export function MapSummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-peat-forest/10 bg-white px-4 py-3">
      <p className="text-xs font-medium text-peat-forest/65">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold text-peat-forest">
        {value}
      </p>
    </div>
  );
}

export { MapSummaryCard as SummaryCard };
