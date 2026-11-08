import { Suspense } from "react";

import { AuditPageLoading } from "@/components/audit/audit-states";
import { LedgerData } from "@/components/audit/ledger/ledger-data";
import type { NextSearchParams } from "@/lib/server/mrv/page-filters";

export default function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<NextSearchParams>;
}) {
  return (
    <Suspense fallback={<AuditPageLoading title="log audit MRV" />}>
      <LedgerData searchParams={searchParams} />
    </Suspense>
  );
}
