import { Skeleton } from "@/components/ui/skeleton";

export function LedgerSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat log audit MRV"
      className="space-y-6"
      role="status"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-md bg-peat-forest/10" />
          <Skeleton className="h-9 w-72 rounded-xl bg-peat-forest/20" />
          <Skeleton className="h-4 w-96 rounded-md bg-peat-forest/10" />
        </div>
        <Skeleton className="h-11 w-36 rounded-xl bg-peat-forest/10" />
      </div>

      {/* Filter Form Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-xs">
        <Skeleton className="h-11 w-44 rounded-xl bg-peat-forest/10" />
        <Skeleton className="h-4 w-64 rounded-md bg-peat-forest/10" />
      </div>

      {/* Table Card Skeleton */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-[#eef3e8] px-5 py-4">
          <Skeleton className="h-5 w-36 rounded-md bg-peat-forest/15" />
          <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/10" />
        </div>
        <div className="divide-y divide-border p-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              className="flex items-center justify-between gap-4 py-3"
              key={index}
            >
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32 rounded-md bg-peat-forest/15 font-mono" />
                <Skeleton className="h-3 w-24 rounded-md bg-peat-forest/10" />
              </div>
              <Skeleton className="h-4 w-40 rounded-md bg-peat-forest/10" />
              <Skeleton className="h-4 w-32 rounded-md bg-peat-forest/10" />
              <Skeleton className="h-6 w-24 rounded-full bg-peat-forest/10" />
              <Skeleton className="h-9 w-20 rounded-xl bg-peat-forest/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
