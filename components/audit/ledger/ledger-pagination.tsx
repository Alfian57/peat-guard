import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { LedgerFilters } from "@/lib/server/mrv/contracts";

import { formatCount } from "../audit-formatters";
import { getLedgerPageHref } from "./ledger-format";

export function LedgerPagination({
  filters,
  page,
  pageSize,
  total,
}: {
  filters: LedgerFilters;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Halaman log audit"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-peat-forest/10 px-4 py-4 sm:px-5"
    >
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Menampilkan {formatCount(firstRow)}–{formatCount(lastRow)} dari{" "}
        {formatCount(total)} catatan
        <span className="sr-only">
          , halaman {page} dari {pageCount}
        </span>
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            aria-label="Halaman sebelumnya"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-peat-forest/10 bg-white text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={getLedgerPageHref(filters, page - 1)}
          >
            <ChevronLeft aria-hidden="true" size={19} />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-peat-forest/10 bg-muted/40 text-muted-foreground"
          >
            <ChevronLeft aria-hidden="true" size={19} />
          </span>
        )}
        {page < pageCount ? (
          <Link
            aria-label="Halaman berikutnya"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-peat-forest/10 bg-white text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={getLedgerPageHref(filters, page + 1)}
          >
            <ChevronRight aria-hidden="true" size={19} />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-peat-forest/10 bg-muted/40 text-muted-foreground"
          >
            <ChevronRight aria-hidden="true" size={19} />
          </span>
        )}
      </div>
    </nav>
  );
}
