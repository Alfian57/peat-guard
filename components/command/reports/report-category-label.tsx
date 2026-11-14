import type { ReportCategory as ReportCategoryValue } from "@/lib/generated/prisma/enums";
import { reportCategoryLabel } from "@/lib/report-labels";

export function ReportCategoryLabel({
  category,
}: {
  category: ReportCategoryValue | null;
}) {
  if (!category) {
    return (
      <span className="text-peat-forest/60">{reportCategoryLabel(null)}</span>
    );
  }

  return reportCategoryLabel(category);
}
