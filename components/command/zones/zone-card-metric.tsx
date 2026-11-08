export function ZoneCardMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] leading-4 text-peat-forest/60">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-peat-forest">{value}</p>
    </div>
  );
}

export { ZoneCardMetric as Metric };
