import { ReportDetailScreen } from "@/components/command/reports/report-detail-screen";

export default async function CommandReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return <ReportDetailScreen key={reportId} reportId={reportId} />;
}
