"use client";

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Filter, X } from "lucide-react";
import type { CommandZone } from "@/lib/server/zones/data";
import type { ReportFilters } from "@/components/command/reports/report-query";
import { REPORT_STATUSES } from "@/components/command/reports/report-contracts";
import { statusLabel } from "@/components/command/reports/report-status-badge";
import { ReportQueueFilterField } from "@/components/command/reports/report-queue-filter-field";

const controlClassName =
  "min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export type ReportQueueFilterDialogProps = {
  draftFilters: ReportFilters;
  error: string;
  isLoading: boolean;
  isOpen: boolean;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onDraftChange: (filters: ReportFilters) => void;
  zones: CommandZone[];
};

export function ReportQueueFilterDialog({
  draftFilters,
  error,
  isLoading,
  isOpen,
  onApply,
  onClose,
  onDraftChange,
  zones,
}: ReportQueueFilterDialogProps) {
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
      aria-describedby="report-queue-filter-desc"
      aria-labelledby="report-queue-filter-title"
      aria-modal="true"
      className="m-auto max-h-[min(90vh,760px)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-peat-forest/15 bg-white p-6 shadow-2xl backdrop:bg-black/50 sm:p-7"
      id="report-queue-filter-dialog"
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
            id="report-queue-filter-title"
          >
            Filter antrean insiden
          </h2>
          <p
            className="mt-1 text-sm text-muted-foreground"
            id="report-queue-filter-desc"
          >
            Saring laporan berdasarkan status penanganan, zona gambut, rentang
            tanggal kejadian, atau jenis data demonstrasi.
          </p>
        </div>
        <button
          aria-label="Tutup dialog filter insiden"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-peat-paper hover:text-peat-forest"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <ReportQueueFilterField label="Status laporan" optional>
          <select
            className={controlClassName}
            data-autofocus
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                status: (event.currentTarget.value ||
                  null) as ReportFilters["status"],
              })
            }
            value={draftFilters.status ?? ""}
          >
            <option value="">Semua status</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </ReportQueueFilterField>

        <ReportQueueFilterField label="Zona gambut" optional>
          <select
            className={controlClassName}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                zoneId: event.currentTarget.value,
              })
            }
            value={draftFilters.zoneId}
          >
            <option value="">Semua zona</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </ReportQueueFilterField>

        <div className="grid gap-3 sm:grid-cols-2">
          <ReportQueueFilterField
            hint="Tanggal WIB, termasuk hari itu"
            label="Dari tanggal"
            optional
          >
            <input
              className={controlClassName + " font-mono"}
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
          </ReportQueueFilterField>

          <ReportQueueFilterField
            hint="Tanggal WIB, termasuk hari itu"
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
          </ReportQueueFilterField>
        </div>

        <ReportQueueFilterField label="Data demonstrasi" optional>
          <select
            className={controlClassName}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                isDemoSample: event.currentTarget
                  .value as ReportFilters["isDemoSample"],
              })
            }
            value={draftFilters.isDemoSample}
          >
            <option value="all">Semua data</option>
            <option value="false">Operasional</option>
            <option value="true">Sampel demo</option>
          </select>
        </ReportQueueFilterField>

        {error ? (
          <p
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
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
