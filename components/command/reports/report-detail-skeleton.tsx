import { Skeleton } from "@/components/ui/skeleton";

export function ReportDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat detail laporan"
      className="space-y-5"
      role="status"
    >
      <Skeleton className="h-6 w-44 rounded-md bg-peat-forest/15" />

      {/* Heading area */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-md bg-peat-forest/10" />
          <Skeleton className="h-9 w-64 rounded-xl bg-peat-forest/20" />
          <Skeleton className="h-4 w-80 rounded-md bg-peat-forest/10" />
        </div>
        <Skeleton className="h-11 w-36 rounded-xl bg-peat-forest/10" />
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs">
        <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/10" />
        <Skeleton className="h-6 w-32 rounded-full bg-peat-forest/15" />
      </div>

      {/* Two columns */}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        {/* Left: Evidence & Photo */}
        <div className="space-y-4 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs">
          <Skeleton className="h-6 w-32 rounded-md bg-peat-forest/15" />
          <Skeleton className="h-72 w-full rounded-xl bg-peat-forest/10" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded-md bg-peat-forest/10" />
            <Skeleton className="h-16 w-full rounded-xl bg-peat-forest/5" />
          </div>
        </div>

        {/* Right: AI analysis & Details */}
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs">
            <Skeleton className="h-5 w-36 rounded-md bg-peat-forest/15" />
            <Skeleton className="h-20 w-full rounded-xl bg-peat-forest/5" />
          </div>
          <div className="space-y-3 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs">
            <Skeleton className="h-5 w-32 rounded-md bg-peat-forest/15" />
            <Skeleton className="h-16 w-full rounded-xl bg-peat-forest/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
