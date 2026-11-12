import {
  AuditAccessDenied,
  AuditDataError,
} from "@/components/audit/audit-states";
import { GeneratorForm } from "@/components/audit/generator/generator-form";
import { getAuditPageSession } from "@/lib/server/audit-page-access";
import { getApprovedZoneValues } from "@/lib/server/mrv/data";

export async function GeneratorData() {
  const session = await getAuditPageSession(["POSKO", "VERIFIKATOR"]);

  if (!session) {
    return (
      <AuditAccessDenied requiredRole="Koordinator posko atau Verifikator" />
    );
  }

  const zones = await getApprovedZoneValues().catch(() => null);

  if (!zones) {
    return <AuditDataError title="Generator laporan MRV" />;
  }

  return (
    <main
      className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      id="audit-content"
    >
      <header className="audit-hide-on-print rounded-3xl bg-[#eaf1e2] px-5 py-6 sm:flex sm:items-end sm:justify-between sm:gap-6 sm:px-8 sm:py-7">
        <div>
          <h1 className="font-heading text-4xl leading-tight font-bold text-peat-forest sm:text-5xl">
            Laporan situasi &amp; audit MRV
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Susun ringkasan yang merujuk pada bukti dan angka dari database.
          </p>
        </div>
        <p className="mt-4 inline-flex h-8 min-h-8 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-xs font-semibold text-peat-forest shadow-xs sm:mt-0">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-peat-sun"
          />
          Draf laporan
        </p>
      </header>
      <GeneratorForm zones={zones} />
    </main>
  );
}
