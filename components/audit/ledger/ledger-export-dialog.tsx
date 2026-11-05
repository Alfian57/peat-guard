"use client";

import { Download, FileJson, FileSpreadsheet, X } from "lucide-react";

import type { LedgerFilters } from "@/lib/server/mrv/contracts";

import { formatCount } from "../audit-formatters";
import { getLedgerExportHref } from "./ledger-format";
import { LedgerDialog, useLedgerDialog } from "./ledger-dialog";

const MAX_EXPORT_ROWS = 5000;

const aiStateLabels: Record<NonNullable<LedgerFilters["aiState"]>, string> = {
  COMPLETED: "Triase AI selesai",
  FAILED: "Triase AI gagal",
  PENDING: "Triase AI menunggu",
  SKIPPED: "AI tidak menganalisis",
};

type LedgerExportDialogProps = {
  filters: LedgerFilters;
  total: number;
  zoneName: string | null;
};

const exportLinkClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-peat-green px-4 text-sm font-semibold text-white hover:bg-peat-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function LedgerExportDialog({
  filters,
  total,
  zoneName,
}: LedgerExportDialogProps) {
  const { closeDialog, dialogRef, onKeyDown, open, openDialog, triggerRef } =
    useLedgerDialog();
  const tooManyRows = total > MAX_EXPORT_ROWS;
  const displayZoneName =
    zoneName ??
    (filters.zoneId
      ? `Zona ${filters.zoneId.slice(0, 8)}… (tidak tersedia)`
      : "Semua zona");
  const from = filters.range?.fromDate ?? "";
  const to = filters.range?.toDate ?? "";
  const dateScope =
    from || to ? `${from || "Awal"} – ${to || "sekarang"}` : null;

  return (
    <div className="audit-hide-on-print">
      <button
        aria-controls={open ? "ledger-export-dialog" : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={exportLinkClassName}
        onClick={openDialog}
        ref={triggerRef}
        type="button"
      >
        <Download aria-hidden="true" size={17} />
        Ekspor data
      </button>

      <LedgerDialog
        describedBy="ledger-export-description"
        dialogRef={dialogRef}
        id="ledger-export-dialog"
        onClose={closeDialog}
        onKeyDown={onKeyDown}
        open={open}
        titleId="ledger-export-title"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="font-heading text-2xl font-bold text-peat-forest"
              id="ledger-export-title"
            >
              Ekspor buku besar MRV
            </h2>
            <p
              className="mt-2 text-sm leading-6 text-muted-foreground"
              id="ledger-export-description"
            >
              Pilih format file. Data diambil dari endpoint privat sesuai filter
              yang sedang diterapkan.
            </p>
          </div>
          <button
            aria-label="Tutup ekspor"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </header>

        <section
          aria-label="Ringkasan cakupan ekspor"
          className="mt-5 rounded-xl bg-peat-paper/70 p-4"
        >
          <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">
                Catatan sesuai filter
              </dt>
              <dd className="mt-1 font-semibold text-peat-forest">
                {formatCount(total)} baris
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">
                Batas endpoint
              </dt>
              <dd className="mt-1 font-semibold text-peat-forest">
                {formatCount(MAX_EXPORT_ROWS)} baris per file
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">
                Wilayah
              </dt>
              <dd className="mt-1 font-semibold text-peat-forest">
                {displayZoneName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">
                Periode WIB
              </dt>
              <dd className="mt-1 font-semibold text-peat-forest">
                {dateScope ?? "Semua tanggal"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-muted-foreground">
                Status bukti dan AI
              </dt>
              <dd className="mt-1 font-semibold text-peat-forest">
                {filters.evidence === "complete"
                  ? "Koordinat, foto, dan triase AI selesai tersedia"
                  : "Semua tingkat kelengkapan bukti"}
                {filters.aiState ? ` · ${aiStateLabels[filters.aiState]}` : ""}
              </dd>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Kelengkapan bukti bukan verifikasi independen lokasi GPS.
              </p>
            </div>
          </dl>
        </section>

        {tooManyRows ? (
          <p
            className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-peat-forest"
            role="alert"
          >
            Hasil melebihi batas {formatCount(MAX_EXPORT_ROWS)} baris. Tutup
            dialog ini dan persempit filter sebelum mengekspor.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              className={exportLinkClassName}
              href={getLedgerExportHref(filters, "csv")}
            >
              <FileSpreadsheet aria-hidden="true" size={17} />
              Unduh CSV
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-peat-green hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href={getLedgerExportHref(filters, "json")}
            >
              <FileJson aria-hidden="true" size={17} />
              Unduh JSON
            </a>
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Berkas mengikuti pemeriksaan akses verifikator. Foto biner dan
          identitas pelapor tidak disertakan; kolom foto berisi referensi ke
          endpoint privat.
        </p>
      </LedgerDialog>
    </div>
  );
}
