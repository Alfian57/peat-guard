import { EditReport } from "@/components/field/edit-report";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditReport reportId={id} />;
}
