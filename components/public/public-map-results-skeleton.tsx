import { Skeleton } from "@/components/ui/skeleton";

export function PublicMapResultsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat hasil area peta"
      className="mt-5 space-y-4"
      role="status"
    >
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-32 rounded-md bg-peat-forest/15" />
        <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/10" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded-md bg-peat-forest/10" />
        <div className="space-y-1.5">
          <Skeleton className="h-10 w-full rounded-xl bg-white/80" />
          <Skeleton className="h-10 w-full rounded-xl bg-white/80" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded-md bg-peat-forest/10" />
        <div className="space-y-1.5">
          <Skeleton className="h-10 w-full rounded-xl bg-white/80" />
          <Skeleton className="h-10 w-full rounded-xl bg-white/80" />
        </div>
      </div>
    </div>
  );
}
