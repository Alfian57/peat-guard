export function ReportMapControlField({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <label className="block text-xs font-semibold text-peat-forest">
      <span className="mb-1.5 block">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] font-normal text-peat-forest/60">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export { ReportMapControlField as Field };
