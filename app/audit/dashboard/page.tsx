import { Suspense } from "react";

import {
  AuditAccessDenied,
  AuditDataError,
  AuditPageLoading,
} from "@/components/audit/audit-states";
import { DashboardView } from "@/components/audit/dashboard/dashboard-view";
import { getAuditPageSession } from "@/lib/server/audit-page-access";
import { getMrvDashboard } from "@/lib/server/mrv/data";
import type { MrvDashboard } from "@/lib/server/mrv/contracts";
import { parseDashboardFilters } from "@/lib/server/mrv/validation";
import {
  firstSearchValue,
  toURLSearchParams,
  type NextSearchParams,
} from "@/lib/server/mrv/page-filters";

async function DashboardData({
  searchParams,
}: {
  searchParams: Promise<NextSearchParams>;
}) {
  const session = await getAuditPageSession(["VERIFIKATOR"]);

  if (!session) {
    return <AuditAccessDenied requiredRole="Verifikator karbon" />;
  }

  const values = await searchParams;
  const params = toURLSearchParams(values);
  const parsed = parseDashboardFilters(params);
  const dashboardFilters = parsed.ok ? parsed.value : { range: null };
  let dashboard: MrvDashboard;

  try {
    dashboard = await getMrvDashboard(dashboardFilters);
  } catch {
    return <AuditDataError title="Dasbor dampak karbon" />;
  }

  return (
    <DashboardView
      dashboard={dashboard}
      filterError={parsed.ok ? null : parsed.error}
      from={firstSearchValue(values, "from")}
      to={firstSearchValue(values, "to")}
    />
  );
}

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
