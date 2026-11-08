import { Suspense } from "react";

import { AuditPageLoading } from "@/components/audit/audit-states";
import { DashboardData } from "@/components/audit/dashboard/dashboard-data";
import type { NextSearchParams } from "@/lib/server/mrv/page-filters";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<NextSearchParams>;
}) {
  return (
    <Suspense fallback={<AuditPageLoading title="dasbor dampak karbon" />}>
      <DashboardData searchParams={searchParams} />
    </Suspense>
  );
}
