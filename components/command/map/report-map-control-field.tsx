export function ReportMapControlField({
  children,
  hint,
  label,
  optional = false,
  required = false,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-peat-forest">
      <span className="mb-1.5 flex items-center gap-1.5">
        {label}
        {required ? (
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        ) : null}
        {optional ? (
          <span className="text-[11px] font-normal text-muted-foreground">
            (opsional)
          </span>
        ) : null}
      </span>
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
