import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { Info } from "lucide-react";

import type {
  ApprovedZoneValues,
  LedgerFilters,
  MrvLedger,
} from "@/lib/server/mrv/contracts";

import { AuditFilterError } from "../audit-states";
import { formatCount } from "../audit-formatters";
import { LedgerExportDialog } from "./ledger-export-dialog";
import { LedgerFilterForm } from "./ledger-filter-form";
import { LedgerPagination } from "./ledger-pagination";
import { LedgerRow } from "./ledger-row";

type LedgerViewProps = {
  filterError: string | null;
  filters: LedgerFilters;
  from: string;
  ledger: MrvLedger;
  to: string;
  zones: ApprovedZoneValues[];
};

export function LedgerView({
  filterError,
  filters,
  from,
  ledger,
  to,
  zones,
}: LedgerViewProps) {
  const selectedZoneName =
    zones.find((zone) => zone.zoneId === filters.zoneId)?.zoneName ?? null;

  return (
    <div className="flex flex-col gap-5" id="audit-content">
      <WorkspacePageHeading
        className="mb-0"
        title="Buku besar audit MRV"
        description="Telusuri bukti lapangan, triase AI, dan riwayat penanganan laporan."
        action={
          <LedgerExportDialog
            filters={filters}
            total={ledger.total}
            zoneName={selectedZoneName}
          />
        }
      />

      {filterError ? <AuditFilterError message={filterError} /> : null}
      <LedgerFilterForm
        aiState={filters.aiState}
        evidence={filters.evidence}
        from={from}
        key={`${filters.reportId ?? ""}:${filters.zoneId ?? ""}:${filters.evidence}:${filters.aiState ?? ""}:${from}:${to}`}
        reportId={filters.reportId}
        to={to}
        zoneId={filters.zoneId}
        zones={zones}
      />

      <section
        aria-label="Riwayat bukti audit MRV"
        className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-peat-forest/10 bg-peat-paper px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-peat-forest">
            {formatCount(ledger.total)} catatan audit
          </div>
          <span className="text-xs text-muted-foreground">
            {ledger.pageSize} catatan per halaman
          </span>
        </div>
        {ledger.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1480px] border-collapse text-left">
              <caption className="sr-only">
                Laporan lapangan, lokasi, zona gambut, kelengkapan bukti, triase
                AI, status penanganan, dan estimasi emisi dicegah per zona.
              </caption>
              <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left" scope="col">
                    ID laporan
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Waktu rekam
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Lokasi & GPS
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Zona gambut
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Kelengkapan bukti
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Triase AI
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Status penanganan
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Estimasi emisi dicegah
                  </th>
                  <th className="px-4 py-3 text-center" scope="col">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.rows.map((row) => (
                  <LedgerRow key={row.reportId} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="font-heading text-2xl font-bold text-peat-forest">
              Tidak ada catatan yang cocok
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ubah filter zona gambut, waktu rekam, kelengkapan bukti, atau
              triase AI.
            </p>
          </div>
        )}
        <LedgerPagination
          filters={filters}
          page={ledger.page}
          pageSize={ledger.pageSize}
          total={ledger.total}
        />
      </section>

      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-muted-foreground">
        <Info
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-peat-green"
          size={15}
        />
        Estimasi emisi dicegah per zona ditampilkan sebagai konteks; laporan
        patroli tidak dijumlahkan kembali ke nilai tersebut. Koordinat tercatat
        belum diverifikasi secara independen.
      </p>
    </div>
  );
}
