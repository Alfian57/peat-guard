import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
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
    <div className="min-w-0" id="audit-content">
      <div className="audit-hide-on-print">
        <WorkspacePageHeading
          title="Generator laporan MRV"
          description="Susun ringkasan dari bukti dan angka yang tersimpan."
          action={
            <span className="rounded-full bg-peat-paper px-3 py-1 text-xs font-medium text-muted-foreground">
              Draf laporan
            </span>
          }
        />
      </div>
      <GeneratorForm zones={zones} />
    </div>
  );
}
