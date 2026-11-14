import { Suspense } from "react";

import { ReportDetail } from "@/components/field/report-detail";
import { FieldReportDetailSkeleton } from "@/components/field/field-report-detail-skeleton";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<FieldReportDetailSkeleton local />}>
      {params.then(({ id }) => (
        <ReportDetail reportId={id} serverReportId={null} />
      ))}
    </Suspense>
  );
}
