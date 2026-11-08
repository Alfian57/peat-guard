import { Suspense, type ReactNode } from "react";

import { AuditHeader } from "@/components/audit/audit-header";
import { AuditHeaderFallback } from "@/components/audit/audit-header-fallback";

import "./audit.css";

export default function AuditLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-peat-paper">
      <a
        className="sr-only rounded-md bg-white px-4 py-3 font-semibold text-peat-forest focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        href="#audit-content"
      >
        Lewati navigasi audit
      </a>
      <div className="audit-hide-on-print">
        <Suspense fallback={<AuditHeaderFallback />}>
          <AuditHeader />
        </Suspense>
      </div>
      {children}
    </div>
  );
}
