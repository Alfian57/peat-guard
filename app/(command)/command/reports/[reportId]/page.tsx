import { Suspense } from "react";

import { ReportDetailScreen } from "@/components/command/reports/report-detail-screen";
import { ReportDetailSkeleton } from "@/components/command/reports/report-detail-skeleton";

export default function CommandReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  return (
    <Suspense fallback={<ReportDetailSkeleton />}>
      {params.then(({ reportId }) => (
        <ReportDetailScreen key={reportId} reportId={reportId} />
      ))}
    </Suspense>
  );
}
