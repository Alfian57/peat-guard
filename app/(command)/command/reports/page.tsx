import { Suspense } from "react";
import { ReportQueueScreen } from "@/components/command/reports/report-queue-screen";
import { ReportQueueSkeleton } from "@/components/command/reports/report-queue-skeleton";

export default function CommandReportsPage() {
  return (
    <Suspense fallback={<ReportQueueSkeleton />}>
      <ReportQueueScreen />
    </Suspense>
  );
}
