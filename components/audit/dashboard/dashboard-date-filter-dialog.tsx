"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { X } from "lucide-react";

export type DashboardDateFilterDialogProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

export function DashboardDateFilterDialog({
  children,
  isOpen,
  onClose,
}: DashboardDateFilterDialogProps) {
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

  if (!isOpen) return null;

  return (
    <dialog
      aria-describedby="dashboard-date-filter-desc"
      aria-labelledby="dashboard-date-filter-title"
      aria-modal="true"
      className="m-auto max-h-[min(90vh,700px)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-2xl backdrop:bg-peat-forest/50 backdrop:backdrop-blur-sm sm:p-7"
      id="dashboard-date-filter-dialog"
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
            id="dashboard-date-filter-title"
          >
            Filter periode aktivitas
          </h2>
          <p
            className="mt-1 text-sm text-muted-foreground"
            id="dashboard-date-filter-desc"
          >
            Pilih rentang tanggal aktivitas untuk mempersempit ringkasan audit
            karbon.
          </p>
        </div>
        <button
          aria-label="Tutup dialog filter tanggal"
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-peat-paper hover:text-peat-forest"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      <div className="mt-5">{children}</div>
    </dialog>
  );
}
