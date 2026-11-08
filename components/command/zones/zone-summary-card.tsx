export function ZoneSummaryCard({
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

export { ZoneSummaryCard as Summary };
