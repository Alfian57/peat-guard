import { Suspense } from "react";

import { AuditPageLoading } from "@/components/audit/audit-states";
import { GeneratorData } from "@/components/audit/generator/generator-data";

export default function GeneratorPage() {
  return (
    <Suspense fallback={<AuditPageLoading title="generator laporan MRV" />}>
      <GeneratorData />
    </Suspense>
  );
}
