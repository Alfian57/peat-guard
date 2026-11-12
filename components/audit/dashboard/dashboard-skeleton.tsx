import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat dasbor dampak karbon"
      className="space-y-6"
      role="status"
    >
      {/* Header with Title and Date Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60 rounded-xl bg-peat-forest/20" />
          <Skeleton className="h-4 w-72 rounded-md bg-peat-forest/10" />
        </div>
        <Skeleton className="h-11 w-48 rounded-xl bg-peat-forest/10" />
      </div>

      {/* 4 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            className="rounded-2xl border border-border bg-white p-5 shadow-xs"
            key={i}
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/10" />
              <Skeleton className="size-8 rounded-xl bg-peat-forest/10" />
            </div>
            <Skeleton className="mt-4 h-8 w-24 rounded-lg bg-peat-forest/15" />
            <Skeleton className="mt-2 h-3 w-36 rounded-md bg-peat-forest/10" />
          </div>
        ))}
      </div>

      {/* Villages table & Carbon Details grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-xs">
          <Skeleton className="h-6 w-44 rounded-md bg-peat-forest/15" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton
                className="h-12 w-full rounded-xl bg-muted/60"
                key={i}
              />
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-xs">
          <Skeleton className="h-6 w-36 rounded-md bg-peat-forest/15" />
          <Skeleton className="h-32 w-full rounded-xl bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
