import { Skeleton } from "@/components/ui/skeleton";

export function FieldReportDetailSkeleton({
  local = false,
}: {
  local?: boolean;
}) {
  return (
    <article
      aria-label="Memuat detail laporan"
      className="w-full min-w-0 motion-reduce:[&_[data-slot=skeleton]]:animate-none"
      role="status"
    >
      <div className="mb-2 flex h-10 items-center" aria-hidden="true">
        <Skeleton className="h-4 w-32 bg-peat-forest/10" />
      </div>
      <Skeleton
        aria-hidden="true"
        className="mb-4 h-8 w-64 max-w-full bg-peat-forest/15 sm:h-9 lg:h-12"
      />
      <div
        className="grid items-stretch gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
        aria-hidden="true"
      >
        <div className="min-w-0 space-y-2 rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs">
          <Skeleton className="h-8 w-36 bg-peat-forest/15" />
          <Skeleton className="aspect-[4/3] max-h-80 w-full rounded-xl bg-peat-forest/10 2xl:max-h-96" />
          <Skeleton className="mt-3 h-5 w-32 bg-peat-forest/10" />
          <Skeleton className="h-4 w-full max-w-64 bg-peat-forest/10" />
        </div>
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <div className="space-y-2 rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs">
            <Skeleton className="h-8 w-32 bg-peat-forest/15" />
            <Skeleton
              className={
                local
                  ? "h-5 w-52 max-w-full bg-peat-forest/10"
                  : "h-6 w-40 rounded-full bg-peat-forest/10"
              }
            />
            {local ? (
              <Skeleton className="h-10 w-40 rounded-xl bg-peat-forest/10" />
            ) : (
              <Skeleton className="h-4 w-44 bg-peat-forest/10" />
            )}
          </div>
          <div className="rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs">
            <Skeleton className="h-8 w-36 bg-peat-forest/15" />
            <div className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
              {Array.from({ length: local ? 3 : 4 }, (_, index) => (
                <div className="space-y-1" key={index}>
                  <Skeleton className="h-4 w-24 bg-peat-forest/10" />
                  <Skeleton className="h-5 w-36 max-w-full bg-peat-forest/10" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1 rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs xl:flex-1">
            <Skeleton className="h-8 w-32 bg-peat-forest/15" />
            <Skeleton className="h-5 w-full max-w-60 bg-peat-forest/10" />
          </div>
        </div>
      </div>
      <Skeleton
        aria-hidden="true"
        className="mx-auto mt-4 h-3 w-48 bg-peat-forest/10"
      />
    </article>
  );
}
