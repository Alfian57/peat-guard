import {
  AuditAccessDenied,
  AuditDataError,
} from "@/components/audit/audit-states";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes";
import { LedgerView } from "@/components/audit/ledger/ledger-view";
import { getAuditPageSession } from "@/lib/server/audit-page-access";
import {
  getApprovedZoneValues,
  getMrvLedger,
  listSubmittedEvidence,
} from "@/lib/server/mrv/data";
import {
  firstSearchValue,
  toURLSearchParams,
  type NextSearchParams,
} from "@/lib/server/mrv/page-filters";
import { parseLedgerFilters } from "@/lib/server/mrv/validation";

export async function LedgerData({
  searchParams,
}: {
  searchParams: Promise<NextSearchParams>;
}) {
  const session = await getAuditPageSession(["VERIFIKATOR"]);

  if (!session) {
    return <AuditAccessDenied requiredRole="Verifikator karbon" />;
  }

  const values = await searchParams;
  const params = toURLSearchParams(values);
  const before = params.get("followUpBefore");
  params.delete("followUpBefore");
  const date = before ? new Date(before) : undefined;
  const parsed = parseLedgerFilters(params);
  const fallback = parseLedgerFilters(new URLSearchParams());

  if (!fallback.ok) {
    return <AuditDataError title="Log audit MRV" />;
  }

  const filters = parsed.ok ? parsed.value : fallback.value;

  const data = await Promise.all([
    getMrvLedger(filters),
    getApprovedZoneValues(),
    filters.reportId
      ? []
      : listSubmittedEvidence(
          date && Number.isFinite(date.getTime()) ? date : undefined,
        ),
  ]).catch(() => null);

  if (!data) {
    return <AuditDataError title="Log audit MRV" />;
  }

  const [ledger, zones, submitted] = data;

  return (
    <>
      {submitted.length ? (
        <section className="mb-5 rounded-xl border border-border bg-white p-4">
          <h2 className="font-heading text-xl font-bold">
            Bukti tambahan menunggu tinjauan
          </h2>
          <ul className="mt-2 flex flex-wrap gap-3 text-sm">
            {submitted.slice(0, 20).map(({ reportId }) => (
              <li key={reportId}>
                <Link
                  className="text-peat-green underline"
                  href={APP_ROUTES.audit.ledgerReport(reportId)}
                >
                  Laporan {reportId.slice(0, 8)}
                </Link>
              </li>
            ))}
          </ul>
          {submitted.length > 20 ? (
            <Link
              className="mt-3 inline-block text-sm text-peat-green underline"
              href={`${APP_ROUTES.audit.ledger}?followUpBefore=${encodeURIComponent(submitted[19].submittedAt.toISOString())}`}
            >
              Tampilkan kiriman lebih lama
            </Link>
          ) : null}
        </section>
      ) : null}
      <LedgerView
        filterError={parsed.ok ? null : parsed.error}
        filters={filters}
        from={firstSearchValue(values, "from")}
        ledger={ledger}
        to={firstSearchValue(values, "to")}
        zones={zones}
      />
    </>
  );
}
