export function LayerCheckbox({
  checked,
  count,
  label,
  onChange,
  swatch,
}: {
  checked: boolean;
  count?: number;
  label: string;
  onChange: (checked: boolean) => void;
  swatch: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-peat-forest">
      <input
        aria-label={label}
        checked={checked}
        className="size-4 accent-peat-forest"
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span aria-hidden="true" className={"size-3 rounded-full " + swatch} />
      {label}
      {count === undefined ? null : (
        <span className="ml-auto shrink-0 font-mono text-xs font-normal text-muted-foreground tabular-nums">
          {new Intl.NumberFormat("id-ID").format(count)}
        </span>
      )}
    </label>
  );
}
