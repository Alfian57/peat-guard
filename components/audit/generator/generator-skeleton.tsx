import { Skeleton } from "@/components/ui/skeleton";

export function GeneratorSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat generator laporan MRV"
      className="grid gap-5 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]"
      role="status"
    >
      {/* Parameter Form Skeleton */}
      <div className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-xs sm:p-6">
        <Skeleton className="h-4 w-32 rounded-md bg-peat-forest/10" />
        <Skeleton className="h-7 w-52 rounded-xl bg-peat-forest/20" />

        <div className="space-y-3 pt-3">
          <Skeleton className="h-16 w-full rounded-xl bg-muted/60" />
          <Skeleton className="h-16 w-full rounded-xl bg-muted/60" />
        </div>

        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/10" />
          <Skeleton className="h-11 w-full rounded-xl bg-muted/60" />
        </div>

        <Skeleton className="h-12 w-full rounded-xl bg-peat-forest/15" />
      </div>

      {/* Preview Section Skeleton */}
      <div className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-xs sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl bg-peat-forest/20" />
          <Skeleton className="h-4 w-80 rounded-md bg-peat-forest/10" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl bg-muted/60" />
          <Skeleton className="h-24 rounded-xl bg-muted/60" />
          <Skeleton className="h-24 rounded-xl bg-muted/60" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl bg-muted/40" />
      </div>
    </div>
  );
}
