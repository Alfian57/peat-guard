import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat dasbor dampak karbon"
      className="min-w-0 space-y-5"
      role="status"
    >
      <div className="space-y-3">
        <Skeleton className="h-10 w-60 max-w-full rounded-xl bg-peat-forest/20" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md bg-peat-forest/10" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-64 max-w-full rounded-md bg-peat-forest/10" />
        <Skeleton className="h-11 w-36 rounded-full bg-peat-forest/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="min-w-0 space-y-3 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs"
            key={index}
          >
            <Skeleton className="h-4 w-28 max-w-full rounded-md bg-peat-forest/10" />
            <Skeleton className="h-9 w-32 max-w-full rounded-lg bg-peat-forest/15" />
            <Skeleton className="h-8 w-full rounded-md bg-peat-forest/5" />
          </div>
        ))}
      </div>
      <div className="space-y-4 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs">
        <Skeleton className="h-6 w-52 max-w-full rounded-md bg-peat-forest/15" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            className="h-12 w-full rounded-xl bg-peat-forest/5"
            key={index}
          />
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-xl bg-peat-forest/5" />
      <Skeleton className="h-20 w-full rounded-2xl bg-peat-forest/5" />
    </div>
  );
}
