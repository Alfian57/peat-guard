import { Skeleton } from "@/components/ui/skeleton";

export function CommandLoading({
  label = "Memuat data POSKO…",
}: {
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="space-y-4 rounded-2xl border border-peat-forest/10 bg-white p-6 shadow-xs"
      role="status"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40 rounded-md bg-peat-forest/15" />
        <Skeleton className="h-4 w-24 rounded-md bg-peat-forest/10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-xl bg-muted/60" />
        <Skeleton className="h-12 w-full rounded-xl bg-muted/60" />
      </div>
    </div>
  );
}
