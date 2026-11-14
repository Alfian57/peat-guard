import { Skeleton } from "@/components/ui/skeleton";

export function MapLoadingState({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat peta pantauan"
      data-map-placeholder=""
      className={
        className ??
        "relative flex h-full min-h-72 w-full flex-col justify-between overflow-hidden rounded-2xl border border-peat-forest/10 bg-[#e7ebe3]/60 p-4 shadow-xs"
      }
      role="status"
    >
      {/* Top bar controls */}
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-8 w-44 rounded-xl bg-peat-forest/10" />
        <div className="flex flex-col gap-1.5 rounded-xl border border-peat-forest/10 bg-white/80 p-1.5 shadow-xs">
          <Skeleton className="size-7 rounded-lg bg-peat-forest/10" />
          <Skeleton className="size-7 rounded-lg bg-peat-forest/10" />
        </div>
      </div>

      {/* Central map hint */}
      <div className="mx-auto flex flex-col items-center gap-2">
        <Skeleton className="size-8 rounded-full bg-peat-forest/15" />
        <Skeleton className="h-4 w-32 rounded-md bg-peat-forest/10" />
      </div>

      {/* Bottom bar legend and attribution */}
      <div className="flex items-end justify-between gap-3">
        <Skeleton className="h-6 w-36 rounded-lg bg-peat-forest/10" />
        <Skeleton className="h-5 w-48 rounded-lg bg-peat-forest/10" />
      </div>
    </div>
  );
}
