import {
  AuditAccessDenied,
  AuditDataError,
} from "@/components/audit/audit-states";
import { LedgerView } from "@/components/audit/ledger/ledger-view";
import { getAuditPageSession } from "@/lib/server/audit-page-access";
import { getApprovedZoneValues, getMrvLedger } from "@/lib/server/mrv/data";
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
  const parsed = parseLedgerFilters(params);
  const fallback = parseLedgerFilters(new URLSearchParams());

  if (!fallback.ok) {
    return <AuditDataError title="Log audit MRV" />;
  }

  const filters = parsed.ok ? parsed.value : fallback.value;

  const data = await Promise.all([
    getMrvLedger(filters),
    getApprovedZoneValues(),
  ]).catch(() => null);

  if (!data) {
    return <AuditDataError title="Log audit MRV" />;
  }

  const [ledger, zones] = data;

  return (
    <LedgerView
      filterError={parsed.ok ? null : parsed.error}
      filters={filters}
      from={firstSearchValue(values, "from")}
      ledger={ledger}
      to={firstSearchValue(values, "to")}
      zones={zones}
    />
  );
}
