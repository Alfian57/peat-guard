"use client";

import Link from "next/link";
import { useState } from "react";
import { Filter, X } from "lucide-react";

import type {
  ApprovedZoneValues,
  LedgerFilters,
} from "@/lib/server/mrv/contracts";

import { LedgerDialog, useLedgerDialog } from "./ledger-dialog";
import { APP_ROUTES } from "@/lib/routes";

type LedgerFilterFormProps = {
  aiState: LedgerFilters["aiState"];
  evidence: LedgerFilters["evidence"];
  from: string;
  reportId: string | null;
  to: string;
  zoneId: string | null;
  zones: ApprovedZoneValues[];
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const aiStateLabels: Record<NonNullable<LedgerFilters["aiState"]>, string> = {
  COMPLETED: "Selesai",
  FAILED: "Gagal",
  PENDING: "Menunggu",
  SKIPPED: "Tidak dianalisis",
};

export function LedgerFilterForm({
  aiState,
  evidence,
  from,
  reportId,
  to,
  zoneId,
  zones,
}: LedgerFilterFormProps) {
  const { closeDialog, dialogRef, onKeyDown, open, openDialog, triggerRef } =
    useLedgerDialog();
  const [selectedZone, setSelectedZone] = useState(zoneId ?? "");
  const [selectedEvidence, setSelectedEvidence] = useState(evidence);
  const [selectedAiState, setSelectedAiState] = useState<
    LedgerFilters["aiState"] | ""
  >(aiState ?? "");
  const [selectedFrom, setSelectedFrom] = useState(from);
  const [selectedTo, setSelectedTo] = useState(to);

  const selectedZoneName =
    zones.find((zone) => zone.zoneId === selectedZone)?.zoneName ?? null;
  const selectedZoneLabel =
    selectedZoneName ??
    (selectedZone
      ? `Zona ${selectedZone.slice(0, 8)}… (tidak tersedia)`
      : "Semua zona");

  const activeFiltersCount =
    (selectedZone ? 1 : 0) +
    (selectedEvidence && selectedEvidence !== "all" ? 1 : 0) +
    (selectedAiState ? 1 : 0) +
    (selectedFrom ? 1 : 0) +
    (selectedTo ? 1 : 0) +
    (reportId ? 1 : 0);
  const hasActiveFilter = activeFiltersCount > 0;

  return (
    <div className="audit-hide-on-print flex flex-wrap items-center justify-between gap-3 pt-1">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
        {hasActiveFilter ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {selectedZoneName ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-peat-paper px-2.5 py-1 font-medium text-peat-forest">
                Zona: {selectedZoneName}
              </span>
            ) : null}
            {selectedEvidence && selectedEvidence !== "all" ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-peat-paper px-2.5 py-1 font-medium text-peat-forest">
                Bukti lengkap
              </span>
            ) : null}
            {selectedAiState ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-peat-paper px-2.5 py-1 font-medium text-peat-forest">
                Triase: {aiStateLabels[selectedAiState]}
              </span>
            ) : null}
            {selectedFrom || selectedTo ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-peat-paper px-2.5 py-1 font-medium text-peat-forest">
                {selectedFrom ? `Dari ${selectedFrom}` : "Awal"} –{" "}
                {selectedTo ? `Sampai ${selectedTo}` : "Sekarang"}
              </span>
            ) : null}
            {reportId ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-peat-paper px-2.5 py-1 font-medium text-peat-forest">
                Laporan: {reportId.slice(0, 8)}…
              </span>
            ) : null}
            <Link
              className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition hover:text-red-700"
              href={APP_ROUTES.audit.ledger}
            >
              <X aria-hidden="true" size={13} />
              Hapus filter
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Menampilkan seluruh catatan audit tanpa filter khusus.
          </p>
        )}
      </div>

      <button
        aria-controls={open ? "ledger-filter-dialog" : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-white px-3 text-xs font-semibold text-peat-forest shadow-xs transition hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        onClick={openDialog}
        ref={triggerRef}
        type="button"
      >
        <Filter aria-hidden="true" size={14} />
        <span>Filter</span>
        {activeFiltersCount > 0 ? (
          <span className="grid size-4.5 min-w-4.5 place-items-center rounded-full bg-peat-green text-[10px] font-bold text-white">
            {activeFiltersCount}
          </span>
        ) : null}
      </button>

      <LedgerDialog
        describedBy="ledger-filter-description"
        dialogRef={dialogRef}
        id="ledger-filter-dialog"
        onClose={closeDialog}
        onKeyDown={onKeyDown}
        open={open}
        titleId="ledger-filter-title"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="font-heading text-2xl font-bold text-peat-forest"
              id="ledger-filter-title"
            >
              Filter buku besar MRV
            </h2>
            <p
              className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground"
              id="ledger-filter-description"
            >
              Pilih wilayah, kelengkapan bukti, triase, atau rentang tanggal
              untuk mempersempit catatan.
            </p>
          </div>
          <button
            aria-label="Tutup filter"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </header>

        <div className="mt-5 rounded-xl bg-peat-paper/70 p-4">
          <h3 className="text-xs font-semibold text-peat-forest">
            Pilihan filter
          </h3>
          <dl className="mt-2 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Wilayah</dt>
              <dd className="font-semibold text-peat-forest">
                {selectedZoneLabel}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Kelengkapan bukti</dt>
              <dd className="font-semibold text-peat-forest">
                {selectedEvidence === "complete"
                  ? "Koordinat dan foto tersedia"
                  : "Semua catatan"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Triase AI</dt>
              <dd className="font-semibold text-peat-forest">
                {selectedAiState
                  ? aiStateLabels[selectedAiState]
                  : "Semua status"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tanggal WIB</dt>
              <dd className="font-semibold text-peat-forest">
                {selectedFrom || selectedTo
                  ? `${selectedFrom || "Awal"} – ${selectedTo || "sekarang"}`
                  : "Semua tanggal"}
              </dd>
            </div>
          </dl>
        </div>

        <form
          action={APP_ROUTES.audit.ledger}
          className="mt-5 space-y-4"
          method="get"
        >
          {reportId ? (
            <input name="reportId" type="hidden" value={reportId} />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label
                className="block text-xs font-semibold text-peat-forest"
                htmlFor="ledger-zone"
              >
                Wilayah zona{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (opsional)
                </span>
              </label>
              <select
                className={fieldClassName}
                data-autofocus
                id="ledger-zone"
                name={selectedZone ? "zoneId" : undefined}
                onChange={(event) => setSelectedZone(event.currentTarget.value)}
                value={selectedZone}
              >
                <option value="">Semua zona</option>
                {selectedZone && !selectedZoneName ? (
                  <option value={selectedZone}>{selectedZoneLabel}</option>
                ) : null}
                {zones.map((zone) => (
                  <option key={zone.zoneId} value={zone.zoneId}>
                    {zone.zoneName}
                    {zone.villageName ? ` · ${zone.villageName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="block text-xs font-semibold text-peat-forest"
                htmlFor="ledger-evidence"
              >
                Status kelengkapan bukti{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (opsional)
                </span>
              </label>
              <select
                aria-describedby="ledger-evidence-help"
                className={fieldClassName}
                id="ledger-evidence"
                name="evidence"
                onChange={(event) => {
                  const value = event.currentTarget
                    .value as LedgerFilters["evidence"];
                  setSelectedEvidence(value);
                }}
                value={selectedEvidence}
              >
                <option value="all">Semua laporan</option>
                <option value="complete">Koordinat dan foto tersedia</option>
              </select>
              <p
                className="text-xs leading-5 text-muted-foreground"
                id="ledger-evidence-help"
              >
                Kelengkapan bukti bukan keputusan verifikator dan tidak
                mengonfirmasi keaslian lokasi GPS.
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="block text-xs font-semibold text-peat-forest"
                htmlFor="ledger-ai-state"
              >
                Status triase AI{" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (opsional)
                </span>
              </label>
              <select
                className={fieldClassName}
                id="ledger-ai-state"
                name={selectedAiState ? "aiState" : undefined}
                onChange={(event) =>
                  setSelectedAiState(
                    event.currentTarget.value as LedgerFilters["aiState"] | "",
                  )
                }
                value={selectedAiState ?? ""}
              >
                <option value="">Semua status</option>
                <option value="COMPLETED">Selesai</option>
                <option value="PENDING">Menunggu</option>
                <option value="FAILED">Gagal</option>
                <option value="SKIPPED">Tidak dianalisis</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="block text-xs font-semibold text-peat-forest"
                htmlFor="ledger-from"
              >
                Dari tanggal (WIB){" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (opsional)
                </span>
              </label>
              <input
                className={fieldClassName}
                id="ledger-from"
                max={selectedTo || undefined}
                name={selectedFrom ? "from" : undefined}
                onChange={(event) => setSelectedFrom(event.currentTarget.value)}
                placeholder="YYYY-MM-DD"
                required={Boolean(selectedTo)}
                type="date"
                value={selectedFrom}
              />
            </div>
            <div className="space-y-2">
              <label
                className="block text-xs font-semibold text-peat-forest"
                htmlFor="ledger-to"
              >
                Sampai tanggal (WIB){" "}
                <span className="text-[11px] font-normal text-muted-foreground">
                  (opsional)
                </span>
              </label>
              <input
                className={fieldClassName}
                id="ledger-to"
                min={selectedFrom || undefined}
                name={selectedTo ? "to" : undefined}
                onChange={(event) => setSelectedTo(event.currentTarget.value)}
                placeholder="YYYY-MM-DD"
                required={Boolean(selectedFrom)}
                type="date"
                value={selectedTo}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <button
              className="inline-flex h-9 min-h-9 items-center justify-center rounded-xl border border-border px-4 text-xs font-semibold text-peat-forest transition hover:bg-peat-paper"
              onClick={closeDialog}
              type="button"
            >
              Batal
            </button>
            <button
              className="inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-xl bg-peat-forest px-4 text-xs font-semibold text-white transition hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              type="submit"
            >
              <Filter aria-hidden="true" size={14} />
              Terapkan filter
            </button>
          </div>
        </form>
      </LedgerDialog>
    </div>
  );
}
