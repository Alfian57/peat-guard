export function ReportDetailRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-peat-forest/60">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-peat-forest">{value}</dd>
    </div>
  );
}

export { ReportDetailRow as Detail };
