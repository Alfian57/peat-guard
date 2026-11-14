import { cn } from "@/lib/utils";
import { FieldReportCardSkeleton } from "./field-report-card-skeleton";

export function FieldReportListSkeleton({
  className,
  count,
  label,
  draft = false,
}: {
  className: string;
  count: number;
  label: string;
  draft?: boolean;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("grid gap-2", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <FieldReportCardSkeleton key={index} draft={draft} />
      ))}
    </div>
  );
}
