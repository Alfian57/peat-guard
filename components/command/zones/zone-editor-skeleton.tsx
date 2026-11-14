import { Skeleton } from "@/components/ui/skeleton";

export function ZoneEditorSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat editor zona"
      className="space-y-5"
      role="status"
    >
      <Skeleton className="h-5 w-44 max-w-full rounded-md bg-peat-forest/15" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-48 rounded-xl bg-peat-forest/20" />
        <Skeleton className="h-4 w-80 max-w-full rounded-md bg-peat-forest/10" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs">
        <div className="grid xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
          <div className="min-w-0 space-y-5 border-b border-peat-forest/10 p-5 sm:p-6 xl:border-r xl:border-b-0">
            <Skeleton className="h-7 w-36 rounded-md bg-peat-forest/15" />
            <Skeleton className="h-4 w-24 rounded-md bg-peat-forest/10" />
            <Skeleton className="h-11 w-full rounded-xl bg-peat-forest/5" />
            <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/10" />
            <Skeleton className="h-11 w-full rounded-xl bg-peat-forest/5" />
            <Skeleton className="h-4 w-32 rounded-md bg-peat-forest/10" />
            <Skeleton className="h-11 w-full rounded-xl bg-peat-forest/5" />
            <Skeleton className="h-14 w-full rounded-xl bg-peat-forest/5" />
          </div>
          <div className="min-w-0 space-y-4 p-5 sm:p-6">
            <Skeleton className="h-7 w-36 rounded-md bg-peat-forest/15" />
            <Skeleton className="h-11 w-64 max-w-full rounded-xl bg-peat-forest/10" />
            <Skeleton className="h-4 w-80 max-w-full rounded-md bg-peat-forest/5" />
            <Skeleton className="h-[clamp(300px,52vh,560px)] w-full rounded-xl bg-peat-forest/10" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-peat-forest/10 px-5 py-4 sm:px-6">
          <Skeleton className="h-11 w-20 rounded-xl bg-peat-forest/5" />
          <Skeleton className="h-11 w-36 rounded-xl bg-peat-forest/15" />
        </div>
      </div>
    </div>
  );
}
