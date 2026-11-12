import { Skeleton } from "@/components/ui/skeleton";

export function ZoneEditorSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat editor zona"
      className="space-y-4"
      role="status"
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded bg-peat-forest/15" />
        <Skeleton className="h-4 w-36 rounded-md bg-peat-forest/15" />
      </div>
      {/* Heading area skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 rounded-xl bg-peat-forest/20" />
        <Skeleton className="h-4 w-80 rounded-md bg-peat-forest/10" />
      </div>

      {/* Editor 2-column layout */}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,390px)_minmax(0,1fr)]">
        {/* Form controls skeleton */}
        <div className="space-y-4 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md bg-peat-forest/10" />
            <Skeleton className="h-11 w-full rounded-xl bg-peat-forest/5" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/10" />
            <Skeleton className="h-11 w-full rounded-xl bg-peat-forest/5" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md bg-peat-forest/10" />
            <Skeleton className="h-24 w-full rounded-xl bg-peat-forest/5" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl bg-peat-forest/15" />
        </div>

        {/* Map panel skeleton */}
        <div className="min-h-[480px] overflow-hidden rounded-2xl border border-peat-forest/10 bg-[#e7ebe3]/60 p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-8 w-44 rounded-xl bg-peat-forest/10" />
            <div className="flex flex-col gap-1.5 rounded-xl border border-peat-forest/10 bg-white/80 p-1.5 shadow-xs">
              <Skeleton className="size-7 rounded-lg bg-peat-forest/10" />
              <Skeleton className="size-7 rounded-lg bg-peat-forest/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
