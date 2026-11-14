import { Skeleton } from "@/components/ui/skeleton";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { FieldReportFormSkeleton } from "./field-report-form-skeleton";

export function FieldReportEditorSkeleton() {
  return (
    <div className="w-full min-w-0">
      <div aria-hidden="true" className="mb-2 flex h-10 items-center">
        <Skeleton className="h-4 w-40 bg-peat-forest/10 motion-reduce:animate-none" />
      </div>
      <WorkspacePageHeading
        compact
        className="mb-4"
        title="Edit laporan"
        description="Perbarui bukti dan catatan sebelum laporan dikirim ke posko."
      />
      <FieldReportFormSkeleton />
    </div>
  );
}
