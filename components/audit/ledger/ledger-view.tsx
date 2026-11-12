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
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-4xl leading-tight font-bold text-peat-forest sm:text-5xl">
            Buku besar audit MRV
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Telusuri waktu, lokasi, bukti, triase, dan riwayat penanganan
            laporan.
          </p>
        </div>
        <LedgerExportDialog
          filters={filters}
          total={ledger.total}
          zoneName={selectedZoneName}
        />
      </header>

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
        className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#eef3e8] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-peat-forest">
            {formatCount(ledger.total)} catatan audit
          </div>
          <span className="text-xs text-muted-foreground">
            {ledger.pageSize} catatan per halaman
          </span>
        </div>
        {ledger.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left">
              <caption className="sr-only">
                Log laporan lapangan, bukti GPS/foto, triase AI, dan konteks
                zona karbon
              </caption>
              <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-peat-forest/70">
                <tr>
                  <th className="px-4 py-3 text-left" scope="col">
                    Audit ID
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Waktu lapangan
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Lokasi & GPS
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Bukti
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Klasifikasi AI
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Penanganan
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Emisi zona
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
              Ubah filter wilayah, tanggal, atau kelengkapan bukti.
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
        Estimasi emisi zona ditampilkan sebagai konteks; laporan patroli tidak
        dijumlahkan menjadi tambahan emisi yang dicegah. Koordinat tercatat
        belum diverifikasi secara independen.
      </p>
    </div>
  );
}
