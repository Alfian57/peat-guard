import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  AuditAccessDenied,
  AuditPageLoading,
} from "@/components/audit/audit-states";
import { formatDateTime } from "@/components/audit/audit-formatters";
import { GeneratorReportPreview } from "@/components/audit/generator/generator-report-preview";
import { API_ROUTES, APP_ROUTES } from "@/lib/routes";
import { getAuditPageSession } from "@/lib/server/audit-page-access";
import { isUuid } from "@/lib/server/command/http";
import { getMrvDocument } from "@/lib/server/mrv/documents";

type DocumentParams = Promise<{ id: string }>;

export default function PublishedPage({ params }: { params: DocumentParams }) {
  return (
    <Suspense fallback={<AuditPageLoading title="dokumen MRV" />}>
      <PublishedDocument params={params} />
    </Suspense>
  );
}

async function PublishedDocument({ params }: { params: DocumentParams }) {
  if (!(await getAuditPageSession(["POSKO", "VERIFIKATOR"])))
    return <AuditAccessDenied requiredRole="Posko atau Verifikator" />;
  const { id } = await params;
  const document = isUuid(id) ? await getMrvDocument(id) : null;
  if (!document) notFound();
  return (
    <div id="audit-content" className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link
          className="text-peat-green hover:underline"
          href={APP_ROUTES.audit.documents}
        >
          Kembali ke arsip
        </Link>
        <p>Terbit {formatDateTime(document.publishedAt.toISOString())}</p>
        <a
          className="rounded-lg border px-3 py-2 text-peat-green"
          href={API_ROUTES.command.mrvPdf(id)}
        >
          Unduh PDF
        </a>
      </div>
      <div className="rounded-2xl bg-white p-5">
        <GeneratorReportPreview report={document.report} />
      </div>
    </div>
  );
}
