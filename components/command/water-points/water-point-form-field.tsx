export function WaterPointFormField({
  children,
  hint,
  label,
  required = false,
  optional = false,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-peat-forest">
      <span className="mb-1.5 flex items-center gap-2">
        {label}
        {required ? <span className="text-red-800">Wajib</span> : null}
        {optional ? (
          <span className="text-xs font-normal text-peat-forest/55">
            Opsional
          </span>
        ) : null}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs font-normal text-peat-forest/60">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export { WaterPointFormField as Field };
