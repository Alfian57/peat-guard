"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
  type ReactNode,
} from "react";

type LedgerDialogProps = {
  children: ReactNode;
  describedBy: string;
  dialogRef: RefObject<HTMLDialogElement | null>;
  id?: string;
  onClose: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDialogElement>) => void;
  open: boolean;
  titleId: string;
};

export function useLedgerDialog() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wasOpen = useRef(false);

  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) dialog.showModal();
      const initialFocus =
        dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      (initialFocus ?? dialogRef.current)?.focus();
      return;
    }

    if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDialogElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
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
    },
    [closeDialog],
  );

  return {
    closeDialog,
    dialogRef,
    onKeyDown,
    open,
    openDialog,
    triggerRef,
  };
}

export function LedgerDialog({
  children,
  describedBy,
  dialogRef,
  id,
  onClose,
  onKeyDown,
  open,
  titleId,
}: LedgerDialogProps) {
  if (!open) return null;

  return (
    <dialog
      aria-describedby={describedBy}
      aria-labelledby={titleId}
      aria-modal="true"
      className="m-auto max-h-[min(90vh,760px)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-xl backdrop:bg-peat-forest/55 sm:p-6"
      id={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
      ref={dialogRef}
      tabIndex={-1}
    >
      {children}
    </dialog>
  );
}
