"use client";

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Filter, X } from "lucide-react";
import { ReportMapControlField } from "@/components/command/map/report-map-control-field";
import {
  REPORT_STATUSES,
  type ReportStatus,
} from "@/components/command/reports/report-contracts";
import {
  statusLabel,
  urgencyLabel,
} from "@/components/command/reports/report-status-badge";
import type { ReportMapFilters } from "@/components/command/reports/report-map-query";
import type { ReportUrgency } from "@/lib/generated/prisma/enums";

const REPORT_URGENCIES: ReportUrgency[] = ["KRITIS", "WASPADA", "RENDAH"];

const controlClassName =
  "min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export type ReportMapFilterDialogProps = {
  draftFilters: ReportMapFilters;
  filtersError: string;
  isLoading: boolean;
  isOpen: boolean;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onDraftChange: (filters: ReportMapFilters) => void;
};

export function ReportMapFilterDialog({
  draftFilters,
  filtersError,
  isLoading,
  isOpen,
  onApply,
  onClose,
  onDraftChange,
}: ReportMapFilterDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      const initialFocus =
        dialog.querySelector<HTMLElement>("[data-autofocus]");
      (initialFocus ?? dialog)?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable[0];
    const last = focusable.at(-1);

    if (!first || !last) {
      event.preventDefault();
      event.currentTarget.focus();
    } else if (
      event.shiftKey &&
      (document.activeElement === first ||
        !event.currentTarget.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
        !event.currentTarget.contains(document.activeElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    onApply(event);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <dialog
      aria-describedby="report-map-filter-desc"
      aria-labelledby="report-map-filter-title"
      aria-modal="true"
      className="m-auto max-h-[min(90vh,760px)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-peat-forest/15 bg-white p-6 shadow-2xl backdrop:bg-black/50 sm:p-7"
      id="report-map-filter-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="font-heading text-2xl font-bold text-peat-forest"
            id="report-map-filter-title"
          >
            Filter pin laporan
          </h2>
          <p
            className="mt-1 text-sm text-muted-foreground"
            id="report-map-filter-desc"
          >
            Saring pin laporan pada peta berdasarkan rentang tanggal rekam,
            status penanganan, atau tingkat urgensi AI.
          </p>
        </div>
        <button
          aria-label="Tutup dialog filter pin laporan"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-peat-paper hover:text-peat-forest"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ReportMapControlField
            hint="Tanggal rekam WIB, termasuk hari itu"
            label="Dari tanggal"
            optional
          >
            <input
              className={controlClassName + " font-mono"}
              data-autofocus
              max={draftFilters.to || undefined}
              onChange={(event) =>
                onDraftChange({
                  ...draftFilters,
                  from: event.currentTarget.value,
                })
              }
              placeholder="YYYY-MM-DD"
              type="date"
              value={draftFilters.from}
            />
          </ReportMapControlField>

          <ReportMapControlField
            hint="Tanggal rekam WIB, termasuk hari itu"
            label="Sampai tanggal"
            optional
          >
            <input
              className={controlClassName + " font-mono"}
              min={draftFilters.from || undefined}
              onChange={(event) =>
                onDraftChange({
                  ...draftFilters,
                  to: event.currentTarget.value,
                })
              }
              placeholder="YYYY-MM-DD"
              type="date"
              value={draftFilters.to}
            />
          </ReportMapControlField>
        </div>

        <ReportMapControlField label="Status penanganan" optional>
          <select
            className={controlClassName}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                status: event.currentTarget.value as ReportStatus | "all",
              })
            }
            value={draftFilters.status}
          >
            <option value="all">Semua status</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </ReportMapControlField>

        <ReportMapControlField label="Urgensi AI" optional>
          <select
            className={controlClassName}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                urgency: event.currentTarget
                  .value as ReportMapFilters["urgency"],
              })
            }
            value={draftFilters.urgency}
          >
            <option value="all">Semua urgensi</option>
            {REPORT_URGENCIES.map((urgency) => (
              <option key={urgency} value={urgency}>
                {urgencyLabel(urgency)}
              </option>
            ))}
            <option value="UNRATED">Belum dinilai</option>
          </select>
        </ReportMapControlField>

        {filtersError ? (
          <p
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {filtersError}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-peat-forest/10 pt-3">
          <button
            className="inline-flex h-9 min-h-9 items-center justify-center rounded-xl border border-border px-4 text-xs font-semibold text-peat-forest transition hover:bg-peat-paper"
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className="inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-xl bg-peat-forest px-4 text-xs font-semibold text-white transition hover:bg-peat-green disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            <Filter aria-hidden="true" size={14} />
            Terapkan
          </button>
        </div>
      </form>
    </dialog>
  );
}
