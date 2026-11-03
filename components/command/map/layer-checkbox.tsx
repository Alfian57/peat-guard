export function LayerCheckbox({
  checked,
  label,
  onChange,
  swatch,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  swatch: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-peat-forest">
      <input
        checked={checked}
        className="size-4 accent-peat-forest"
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span aria-hidden="true" className={"size-3 rounded-full " + swatch} />
      {label}
    </label>
  );
}
