export function CommandLoading({
  label = "Memuat data POSKO…",
}: {
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="grid min-h-52 place-items-center rounded-2xl border border-peat-forest/10 bg-white px-5 text-center text-sm text-peat-forest/75"
      role="status"
    >
      <span>{label}</span>
    </div>
  );
}
