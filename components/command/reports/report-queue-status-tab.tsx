export function ReportQueueStatusTab({
  count,
  isSelected,
  label,
  onSelect,
}: {
  count: number | null;
  isSelected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={
        "flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-left text-xs font-semibold transition-colors sm:px-4 sm:text-sm " +
        (isSelected
          ? "bg-peat-forest text-white"
          : "text-peat-forest hover:bg-peat-paper")
      }
      onClick={onSelect}
      type="button"
    >
      <span>{label}</span>
      <span
        className={
          "rounded-full px-2 py-1 font-mono text-xs " +
          (isSelected
            ? "bg-white/15 text-white"
            : "bg-peat-paper text-peat-forest/75")
        }
      >
        {count === null ? "…" : new Intl.NumberFormat("id-ID").format(count)}
      </span>
    </button>
  );
}

export { ReportQueueStatusTab as StatusTab };
