"use client";

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
  to: string;
  zoneId: string | null;
  zones: ApprovedZoneValues[];
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const buttonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-peat-green hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
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

  return (
    <div className="audit-hide-on-print">
      <button
        aria-controls={open ? "ledger-filter-dialog" : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={buttonClassName}
        onClick={openDialog}
        ref={triggerRef}
        type="button"
      >
        <Filter aria-hidden="true" size={17} />
        Filter buku besar
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label
                className="block text-xs font-semibold text-peat-forest"
                htmlFor="ledger-zone"
              >
                Wilayah zona
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
                Status kelengkapan bukti
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
                Status triase AI
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
                Dari tanggal (WIB)
              </label>
              <input
                className={fieldClassName}
                id="ledger-from"
                max={selectedTo || undefined}
                name={selectedFrom ? "from" : undefined}
                onChange={(event) => setSelectedFrom(event.currentTarget.value)}
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
                Sampai tanggal (WIB)
              </label>
              <input
                className={fieldClassName}
                id="ledger-to"
                min={selectedFrom || undefined}
                name={selectedTo ? "to" : undefined}
                onChange={(event) => setSelectedTo(event.currentTarget.value)}
                required={Boolean(selectedFrom)}
                type="date"
                value={selectedTo}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              className="min-h-11 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white transition hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              type="submit"
            >
              Terapkan filter
            </button>
            <a
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-peat-green underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href={APP_ROUTES.audit.ledger}
            >
              Atur ulang
            </a>
          </div>
        </form>
      </LedgerDialog>
    </div>
  );
}
