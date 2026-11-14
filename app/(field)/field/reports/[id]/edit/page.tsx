import { Suspense } from "react";

import { EditReport } from "@/components/field/edit-report";
import { FieldReportEditorSkeleton } from "@/components/field/field-report-editor-skeleton";

export default function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<FieldReportEditorSkeleton />}>
      {params.then(({ id }) => (
        <EditReport reportId={id} />
      ))}
    </Suspense>
  );
}
