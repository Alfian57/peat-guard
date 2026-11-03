import { ArrowLeft, ArrowRight, FileText } from "lucide-react";

import { ReportCard } from "@/components/command/reports/report-card";
import type {
  ReportListItem,
  ReportListResponse,
} from "@/components/command/reports/report-contracts";

export function ReportQueueResults({
  currentPage,
  isLoading,
  onPageChange,
  onResetFilters,
  pageSize,
  response,
  zones,
}: {
  currentPage: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  pageSize: number;
  response: ReportListResponse | null;
  zones: ReadonlyMap<string, string>;
}) {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Memuat antrean laporan"
        className="grid min-h-64 place-items-center rounded-2xl border border-peat-forest/10 bg-white text-sm text-peat-forest/70"
        role="status"
      >
        Memuat antrean laporan…
      </div>
    );
  }

  if (!response || response.reports.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-peat-forest/20 bg-white p-7 text-center">
        <div>
          <FileText
            aria-hidden="true"
            className="mx-auto text-peat-green"
            size={30}
          />
          <h2 className="mt-3 font-heading text-2xl font-bold text-peat-forest">
            Tidak ada laporan yang sesuai
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-peat-forest/70">
            Ubah status atau rentang tanggal, atau tampilkan kembali semua
            laporan.
          </p>
          <button
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white hover:bg-peat-green"
            onClick={onResetFilters}
            type="button"
          >
            Tampilkan semua laporan
          </button>
        </div>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(response.total / pageSize));
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, response.total);

  return (
    <section aria-label="Hasil antrean laporan">
      <p aria-live="polite" className="mb-3 text-sm text-peat-forest/70">
        Menampilkan {formatNumber(firstItem)}–{formatNumber(lastItem)} dari{" "}
        {formatNumber(response.total)} laporan
      </p>
      <ul className="space-y-3">
        {response.reports.map((report) => (
          <ReportRow key={report.id} report={report} zones={zones} />
        ))}
      </ul>
      {pageCount > 1 ? (
        <nav
          aria-label="Halaman antrean laporan"
          className="mt-4 flex items-center justify-between rounded-2xl border border-peat-forest/10 bg-white p-3"
        >
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={15} />
            Sebelumnya
          </button>
          <p
            aria-current="page"
            className="font-mono text-xs text-peat-forest/65"
          >
            {currentPage} / {pageCount}
          </p>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
            type="button"
          >
            Berikutnya
            <ArrowRight aria-hidden="true" size={15} />
          </button>
        </nav>
      ) : null}
    </section>
  );
}

function ReportRow({
  report,
  zones,
}: {
  report: ReportListItem;
  zones: ReadonlyMap<string, string>;
}) {
  return (
    <ReportCard
      report={report}
      zoneName={report.zoneId ? (zones.get(report.zoneId) ?? null) : null}
    />
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}
