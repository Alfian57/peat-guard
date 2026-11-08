export function ReportMapLegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className={`size-3 rounded-full ${color}`} />
      {label}
    </li>
  );
}

export { ReportMapLegendItem as LegendItem };
