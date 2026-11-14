export function GeneratorMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border-b border-peat-forest/10 py-3 last:border-b-0 sm:grid sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-peat-forest sm:mt-0 sm:text-right">
        {value}
        {note ? (
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            {note}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
