import { Skeleton } from "@/components/ui/skeleton";

export function FieldReportCardSkeleton() {
  return (
    <article
      aria-busy="true"
      aria-label="Memuat laporan"
      className="rounded-2xl border border-border bg-white p-3"
      role="status"
    >
      <div className="flex min-h-[88px] items-center gap-3">
        <Skeleton className="size-[72px] shrink-0 rounded-xl bg-secondary" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32 rounded-md bg-peat-forest/15" />
          <Skeleton className="h-3 w-44 rounded-md bg-muted-foreground/15" />
          <Skeleton className="h-3 w-36 rounded-md bg-muted-foreground/10 font-mono" />
        </div>
      </div>
    </article>
  );
}
