import { Skeleton } from "@/components/ui/skeleton";

export function ReportDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat detail laporan"
      className="space-y-5"
      role="status"
    >
      <Skeleton className="h-6 w-44 max-w-full rounded-md bg-peat-forest/15" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Skeleton className="h-10 w-64 max-w-full rounded-xl bg-peat-forest/20" />
          <Skeleton className="h-4 w-80 max-w-full rounded-md bg-peat-forest/10" />
          <Skeleton className="h-6 w-36 rounded-full bg-peat-forest/10" />
        </div>
        <Skeleton className="h-11 w-36 shrink-0 rounded-full bg-peat-forest/10" />
      </div>
      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6">
          <Skeleton className="h-6 w-32 rounded-md bg-peat-forest/15" />
          <Skeleton className="aspect-[4/3] max-h-[440px] w-full rounded-xl bg-peat-forest/10" />
          <Skeleton className="h-4 w-40 max-w-full rounded-md bg-peat-forest/10" />
          <Skeleton className="h-12 w-full rounded-xl bg-peat-forest/5" />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <div className="space-y-4 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6">
            <Skeleton className="h-6 w-36 rounded-md bg-peat-forest/15" />
            <Skeleton className="h-20 w-full rounded-xl bg-peat-forest/5" />
            <Skeleton className="h-11 w-full rounded-lg bg-peat-forest/5" />
          </div>
          <div className="space-y-4 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6">
            <Skeleton className="h-6 w-32 rounded-md bg-peat-forest/15" />
            <Skeleton className="h-32 w-full rounded-xl bg-peat-forest/5" />
          </div>
          <div className="space-y-3 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6 xl:flex-1">
            <Skeleton className="h-6 w-32 rounded-md bg-peat-forest/15" />
            <Skeleton className="h-8 w-72 max-w-full rounded-xl bg-peat-forest/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
