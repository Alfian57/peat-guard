import { ReportDetail } from "@/components/field/report-detail";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportDetail reportId={id} />;
}
