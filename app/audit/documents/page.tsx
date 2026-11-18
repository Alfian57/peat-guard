import Link from "next/link";
import { Suspense } from "react";
import {
  AuditAccessDenied,
  AuditPageLoading,
} from "@/components/audit/audit-states";
import { formatDateTime } from "@/components/audit/audit-formatters";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { API_ROUTES, APP_ROUTES } from "@/lib/routes";
import { getAuditPageSession } from "@/lib/server/audit-page-access";
import { isUuid } from "@/lib/server/command/http";
import { listMrvDocuments } from "@/lib/server/mrv/documents";

type ArchiveParams = Promise<{ before?: string }>;

export default function ArchivePage({
  searchParams,
}: {
  searchParams: ArchiveParams;
}) {
  return (
    <Suspense fallback={<AuditPageLoading title="arsip laporan MRV" />}>
      <Archive searchParams={searchParams} />
    </Suspense>
  );
}

async function Archive({ searchParams }: { searchParams: ArchiveParams }) {
  if (!(await getAuditPageSession(["POSKO", "VERIFIKATOR"])))
    return <AuditAccessDenied requiredRole="Posko atau Verifikator" />;
  const { before } = await searchParams;
  const { entries, next } = await listMrvDocuments(
    typeof before === "string" && isUuid(before) ? before : undefined,
  );
  return (
    <section id="audit-content" className="space-y-5">
      <WorkspacePageHeading
        title="Arsip laporan MRV"
        description="Buka atau unduh dokumen yang diterbitkan Verifikator."
      />
      {entries.length ? (
        <ul className="divide-y rounded-xl border border-border bg-white">
          {entries.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <Link
                  className="font-semibold text-peat-green hover:underline"
                  href={APP_ROUTES.audit.document(item.id)}
                >
                  {item.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {item.scope.from} – {item.scope.to} · Terbit{" "}
                  {formatDateTime(item.publishedAt.toISOString())}
                </p>
              </div>
              <a
                className="rounded-lg border border-border px-3 py-2 text-sm"
                href={API_ROUTES.command.mrvPdf(item.id)}
              >
                Unduh PDF
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-4">
          Belum ada dokumen terbit pada halaman ini.
        </p>
      )}
      {next ? (
        <Link
          className="inline-block text-peat-green hover:underline"
          href={`${APP_ROUTES.audit.documents}?before=${next}`}
        >
          Dokumen lebih lama
        </Link>
      ) : null}
      {before ? (
        <Link
          className="mx-3 inline-block text-peat-green hover:underline"
          href={APP_ROUTES.audit.documents}
        >
          Dokumen terbaru
        </Link>
      ) : null}
    </section>
  );
}
