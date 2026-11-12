import { Skeleton } from "@/components/ui/skeleton";

export function FieldReportDetailSkeleton() {
  return (
    <article
      aria-busy="true"
      aria-label="Memuat detail laporan"
      className="mx-auto w-full max-w-xl px-4 pt-4 lg:max-w-4xl lg:px-0 lg:pt-0"
      role="status"
    >
      <Skeleton className="h-6 w-24 rounded-md bg-muted-foreground/15" />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-md bg-muted-foreground/15" />
          <Skeleton className="h-9 w-48 rounded-xl bg-peat-forest/20" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full bg-amber-100" />
      </div>

      <div className="mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary">
        <Skeleton className="size-full bg-muted/60" />
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-white p-4">
        <Skeleton className="h-5 w-32 rounded-md bg-peat-forest/15" />
        <Skeleton className="h-4 w-48 rounded-md bg-muted-foreground/15" />
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-white p-4">
        <Skeleton className="h-5 w-36 rounded-md bg-peat-forest/15" />
        <Skeleton className="h-16 w-full rounded-xl bg-muted/40" />
      </div>
    </article>
  );
}
