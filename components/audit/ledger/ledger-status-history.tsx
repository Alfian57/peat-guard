"use client";

import { History, X } from "lucide-react";
import { useId } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MrvLedgerRow } from "@/lib/server/mrv/contracts";
import { handlingStatusLabel } from "@/lib/report-labels";
import { formatDateTime } from "../audit-formatters";
import { LedgerDialog, useLedgerDialog } from "./ledger-dialog";

export function LedgerStatusHistory({ row }: { row: MrvLedgerRow }) {
  const { closeDialog, dialogRef, onKeyDown, open, openDialog, triggerRef } =
    useLedgerDialog();
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const shortId = row.reportId.slice(0, 8);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              aria-controls={open ? dialogId : undefined}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label={`Riwayat status laporan ${shortId}`}
              className="inline-grid size-9 shrink-0 place-items-center rounded-full border border-border bg-white text-peat-green shadow-xs transition-colors hover:border-peat-forest/25 hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onClick={openDialog}
              ref={triggerRef}
              type="button"
            >
              <History aria-hidden="true" size={16} />
            </button>
          }
        />
        <TooltipContent>
          Riwayat status · {row.statusHistory.length}
        </TooltipContent>
      </Tooltip>
      <LedgerDialog
        describedBy={descriptionId}
        dialogRef={dialogRef}
        id={dialogId}
        onClose={closeDialog}
        onKeyDown={onKeyDown}
        open={open}
        titleId={titleId}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="font-heading text-2xl font-bold text-peat-forest"
              id={titleId}
            >
              Riwayat status
            </h2>
            <p
              className="mt-2 text-sm text-muted-foreground"
              id={descriptionId}
            >
              Perubahan penanganan laporan {shortId}.
            </p>
          </div>
          <button
            aria-label="Tutup riwayat status"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            data-autofocus
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </header>
        {row.statusHistory.length > 0 ? (
          <ol className="mt-5 space-y-4 border-l border-peat-green/20 pl-4 text-sm">
            {row.statusHistory.map((event) => (
              <li key={event.eventId}>
                <time
                  className="block text-muted-foreground"
                  dateTime={event.createdAt}
                >
                  {formatDateTime(event.createdAt)} · {event.actorRole}
                </time>
                <span className="font-semibold text-peat-forest">
                  {handlingStatusLabel(event.previousStatus)} →{" "}
                  {handlingStatusLabel(event.nextStatus)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-5 rounded-xl border border-peat-forest/10 p-4 text-sm text-muted-foreground">
            Belum ada perubahan status.
          </p>
        )}
      </LedgerDialog>
    </>
  );
}
