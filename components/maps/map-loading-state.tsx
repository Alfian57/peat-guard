export function MapLoadingState() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat peta"
      className="grid h-full min-h-72 place-items-center rounded-2xl bg-peat-forest/10 px-6 text-center text-sm text-peat-forest"
      role="status"
    >
      <span className="animate-pulse">Memuat peta pantauan…</span>
    </div>
  );
}
