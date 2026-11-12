import { Skeleton } from "@/components/ui/skeleton";

export function WaterPointEditorSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat editor titik air"
      className="space-y-6 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6"
      role="status"
    >
      <div className="space-y-2">
        <Skeleton className="h-5 w-40 rounded-md bg-peat-forest/15" />
        <Skeleton className="h-10 w-full rounded-xl bg-muted/40" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded-md bg-peat-forest/15" />
        <Skeleton className="h-10 w-full rounded-xl bg-muted/40" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-48 rounded-md bg-peat-forest/15" />
        <Skeleton className="h-56 w-full rounded-2xl bg-muted/30" />
      </div>
    </div>
  );
}
