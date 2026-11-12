import { DashboardSkeleton } from "@/components/audit/dashboard/dashboard-skeleton";
import { GeneratorSkeleton } from "@/components/audit/generator/generator-skeleton";
import { LedgerSkeleton } from "@/components/audit/ledger/ledger-skeleton";

export function AuditPageLoading({ title }: { title: string }) {
  const normalized = title.toLowerCase();

  return (
    <main
      aria-busy="true"
      aria-label={`Memuat ${title}`}
      className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8"
      id="audit-content"
    >
      {normalized.includes("dasbor") ? (
        <DashboardSkeleton />
      ) : normalized.includes("log") || normalized.includes("ledger") ? (
        <LedgerSkeleton />
      ) : normalized.includes("generator") ? (
        <GeneratorSkeleton />
      ) : (
        <DashboardSkeleton />
      )}
    </main>
  );
}
