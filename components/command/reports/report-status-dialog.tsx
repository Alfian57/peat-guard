import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  REPORT_STATUSES,
  type ReportDetail,
  type ReportStatus,
} from "@/components/command/reports/report-contracts";
import {
  statusLabel,
  ReportUrgencyBadge,
} from "@/components/command/reports/report-status-badge";

export function ReportStatusDialog({
  error,
  isSaving,
  onCancel,
  onSave,
  report,
}: {
  error: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (nextStatus: ReportStatus, note: string) => void;
  report: ReportDetail;
}) {
  const [nextStatus, setNextStatus] = useState<ReportStatus>(
    report.handlingStatus,
  );
  const [note, setNote] = useState("");
  const dialogRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    dialogRef.current
      ?.querySelector<HTMLInputElement>('input[name="nextStatus"]:checked')
      ?.focus();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nextStatus !== report.handlingStatus) {
      onSave(nextStatus, note);
    }
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape" && !isSaving) {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input[type="radio"]:checked, textarea:not([disabled])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-peat-forest/65 p-3 sm:p-6"
      role="presentation"
    >
      <form
        aria-labelledby="report-status-heading"
        aria-modal="true"
        className="my-auto w-full max-w-2xl space-y-5 rounded-2xl border-[10px] border-peat-forest bg-peat-paper p-5 shadow-2xl sm:p-7"
        onKeyDown={handleDialogKeyDown}
        onSubmit={submit}
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-peat-forest/10 pb-4">
          <div>
            <h2
              className="font-heading text-3xl font-bold text-peat-forest"
              id="report-status-heading"
            >
              Update status penanganan
            </h2>
            <p className="mt-1 text-sm text-peat-forest/65">
              Laporan {report.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            aria-label="Tutup dialog status"
            className="grid min-h-11 min-w-11 place-items-center rounded-lg text-2xl text-peat-forest hover:bg-white disabled:opacity-50"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
          <p className="text-sm font-medium text-peat-forest">
            Status saat ini: {statusLabel(report.handlingStatus)}
          </p>
          <ReportUrgencyBadge urgency={report.aiUrgency} />
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-peat-forest">
            Status penanganan <span className="text-red-800">Wajib</span>
          </legend>
          {REPORT_STATUSES.map((status) => (
            <label
              className={
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-colors " +
                (nextStatus === status
                  ? "border-peat-green bg-secondary text-peat-forest"
                  : "border-peat-forest/10 bg-white text-peat-forest hover:border-peat-green/50")
              }
              key={status}
            >
              <input
                checked={nextStatus === status}
                className="size-4 accent-peat-forest"
                name="nextStatus"
                onChange={() => setNextStatus(status)}
                type="radio"
                value={status}
              />
              {statusLabel(status)}
              {status === report.handlingStatus ? (
                <span className="ml-auto text-xs font-normal text-peat-forest/60">
                  Saat ini
                </span>
              ) : null}
            </label>
          ))}
        </fieldset>

        <label className="block text-sm font-semibold text-peat-forest">
          <span className="mb-1.5 block">
            Catatan penanganan{" "}
            <span className="font-normal text-peat-forest/60">Opsional</span>
          </span>
          <textarea
            className="min-h-28 w-full resize-y rounded-xl border border-peat-forest/15 bg-white px-3 py-2 text-sm text-peat-forest"
            maxLength={500}
            onChange={(event) => setNote(event.currentTarget.value)}
            placeholder="Catat arahan atau hasil koordinasi POSKO."
            value={note}
          />
          <span className="mt-1 block text-right text-xs font-normal text-peat-forest/60">
            {note.length}/500
          </span>
        </label>

        {error ? (
          <p
            className="rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-900"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-peat-forest/10 pt-4 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-xl border border-peat-forest/20 bg-white px-5 text-sm font-semibold text-peat-forest"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            Batal
          </button>
          <button
            className="min-h-11 rounded-xl bg-peat-green px-5 text-sm font-semibold text-white hover:bg-peat-forest disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving || nextStatus === report.handlingStatus}
            type="submit"
          >
            {isSaving ? "Menyimpan…" : "Simpan pembaruan status"}
          </button>
        </div>
      </form>
    </div>
  );
}
