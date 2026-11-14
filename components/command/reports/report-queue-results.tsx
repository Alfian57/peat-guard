import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";

import type { ReportListResponse } from "@/components/command/reports/report-contracts";
import { ReportQueueRow } from "@/components/command/reports/report-queue-row";
import { ReportQueueSkeleton } from "@/components/command/reports/report-queue-skeleton";
import {
  buildPageHref,
  type ReportFilters,
} from "@/components/command/reports/report-query";
import { APP_ROUTES } from "@/lib/routes";

export function ReportQueueResults({
  currentPage,
  filters,
  isLoading,
  onPageChange,
  onResetFilters,
  pageSize,
  resetHref,
  response,
  zones,
}: {
  currentPage: number;
  filters?: ReportFilters;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  pageSize: number;
  resetHref?: string;
  response: ReportListResponse | null;
  zones: ReadonlyMap<string, string>;
}) {
  if (isLoading) {
    return <ReportQueueSkeleton />;
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
            Ubah filter status penanganan, zona gambut, waktu kejadian, atau
            jenis data, atau tampilkan semua laporan.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-peat-green"
            href={resetHref ?? APP_ROUTES.command.reports}
            onClick={onResetFilters}
            role="button"
          >
            Tampilkan semua laporan
          </Link>
        </div>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(response.total / pageSize));
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, response.total);

  const previousHref = filters
    ? buildPageHref(filters, Math.max(1, currentPage - 1))
    : "#";
  const nextHref = filters
    ? buildPageHref(filters, Math.min(pageCount, currentPage + 1))
    : "#";

  return (
    <section aria-label="Hasil antrean laporan">
      <p aria-live="polite" className="mb-3 text-sm text-peat-forest/70">
        Menampilkan {formatNumber(firstItem)}–{formatNumber(lastItem)} dari{" "}
        {formatNumber(response.total)} laporan
      </p>
      <div className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] border-collapse text-left">
            <caption className="sr-only">
              Antrean laporan patroli gambut
            </caption>
            <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-peat-forest/70">
              <tr>
                <th className="px-4 py-3.5" scope="col">
                  ID laporan
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Jenis data
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Zona gambut & lokasi
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Triase AI
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Urgensi AI
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Status penanganan
                </th>
                <th className="px-4 py-3.5 text-right" scope="col">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peat-forest/10 text-sm">
              {response.reports.map((report) => (
                <ReportQueueRow key={report.id} report={report} zones={zones} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pageCount > 1 ? (
        <nav
          aria-label="Halaman antrean laporan"
          className="mt-4 flex items-center justify-between rounded-2xl border border-peat-forest/10 bg-white p-3"
        >
          {currentPage > 1 ? (
            <Link
              aria-label="Halaman sebelumnya"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest transition hover:bg-peat-paper"
              href={previousHref}
              onClick={() => onPageChange(currentPage - 1)}
              role="button"
              scroll={false}
            >
              <ArrowLeft aria-hidden="true" size={15} />
              Sebelumnya
            </Link>
          ) : (
            <button
              aria-disabled="true"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest disabled:cursor-not-allowed disabled:opacity-50"
              disabled
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={15} />
              Sebelumnya
            </button>
          )}
          <p
            aria-current="page"
            className="font-mono text-xs text-peat-forest/65"
          >
            {currentPage} / {pageCount}
          </p>
          {currentPage < pageCount ? (
            <Link
              aria-label="Halaman berikutnya"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest transition hover:bg-peat-paper"
              href={nextHref}
              onClick={() => onPageChange(currentPage + 1)}
              role="button"
              scroll={false}
            >
              Berikutnya
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          ) : (
            <button
              aria-disabled="true"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-peat-forest/15 px-3 text-sm font-semibold text-peat-forest disabled:cursor-not-allowed disabled:opacity-50"
              disabled
              type="button"
            >
              Berikutnya
              <ArrowRight aria-hidden="true" size={15} />
            </button>
          )}
        </nav>
      ) : null}
    </section>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}
