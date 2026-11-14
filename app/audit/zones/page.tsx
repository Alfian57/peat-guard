import { Suspense } from "react";

import { AuditPageLoading } from "@/components/audit/audit-states";
import { AuditZonesData } from "@/components/audit/zones/audit-zones-data";

export default function AuditZonesPage() {
  return (
    <Suspense fallback={<AuditPageLoading title="verifikasi zona" />}>
      <AuditZonesData />
    </Suspense>
  );
}
