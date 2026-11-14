import { Skeleton } from "@/components/ui/skeleton";

export function FieldReportCardSkeleton({
  draft = false,
}: {
  draft?: boolean;
}) {
  return (
    <article
      aria-hidden="true"
      className="rounded-xl border border-peat-forest/10 bg-white p-2.5"
    >
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-14 shrink-0 rounded-lg bg-secondary motion-reduce:animate-none" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 max-w-full rounded-md bg-peat-forest/15 motion-reduce:animate-none" />
            {draft ? null : (
              <Skeleton className="hidden h-4 w-12 shrink-0 rounded-full bg-peat-forest/10 motion-reduce:animate-none sm:block" />
            )}
          </div>
          <Skeleton className="h-3 w-36 max-w-full rounded-md bg-peat-forest/10 motion-reduce:animate-none" />
          <Skeleton className="h-2.5 w-24 max-w-full rounded-md bg-peat-forest/10 motion-reduce:animate-none" />
        </div>
        {draft ? (
          <span className="grid size-11 shrink-0 place-items-center">
            <Skeleton className="size-4 rounded bg-peat-forest/10 motion-reduce:animate-none" />
          </span>
        ) : null}
      </div>
    </article>
  );
}
