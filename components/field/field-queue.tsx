"use client";

import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { FieldFeedback } from "./field-feedback";
import { FieldQueueSummary } from "./field-queue-summary";
import { useEffect, useRef, useState } from "react";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { FieldOutboxSection } from "./field-outbox-section";
import { ServerReportHistorySection } from "./server-report-history-section";
import { useFieldReportHistory } from "./use-field-report-history";
import { toast } from "@/components/ui/toast";
import { splitReportHistory } from "@/lib/client/offline/server-report-client";
import { removeQueuedReport } from "@/lib/client/offline/report-store";

export function FieldQueue() {
  const {
    isConnected,
    isSyncing,
    ownerId,
    ownerStatus,
    refreshQueue,
    setNotice,
    syncNow,
  } = useFieldShell();
  const history = useFieldReportHistory();
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const pendingReport = history.localReports.find(
    (report) => report.clientReportId === deleteReportId,
  );
  const { outboxReports, localSentFallback } = splitReportHistory(
    history.serverReports,
    history.localReports,
  );
  const waitingCount = outboxReports.length;
  const isCheckingOwner = ownerStatus === "loading";
  const initialHistoryLoading =
    history.serverStatus === "loading" && history.serverReports.length === 0;
  const sentCount =
    history.serverStatus === "loaded" || history.serverReports.length
      ? history.serverTotal
      : localSentFallback.length;
  const reloadPending =
    isReloading || history.isLoadingLocal || history.serverStatus === "loading";

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;
    if (deleteReportId && !dialog.open) dialog.showModal();
    if (!deleteReportId && dialog.open) dialog.close();
  }, [deleteReportId]);

  async function syncAll() {
    await syncNow();
    await history.refreshAll();
    await refreshQueue();
  }

  async function reloadQueue() {
    if (reloadPending) return;
    setIsReloading(true);
    try {
      await history.refreshAll();
    } finally {
      setIsReloading(false);
    }
  }

  async function confirmDeleteDraft() {
    if (!ownerId || !pendingReport || isDeleting) return;
    setIsDeleting(true);
    try {
      const removed = await removeQueuedReport(
        pendingReport.clientReportId,
        ownerId,
      );
      setDeleteReportId(null);
      if (removed) {
        toast.success(
          "Draf dihapus",
          "Draf lokal berhasil dihapus dari perangkat.",
        );
      }
      setNotice(
        removed
          ? "Draf lokal dihapus dari perangkat. Laporan yang sudah terkirim tidak dapat dihapus di sini."
          : "Draf sedang disinkronkan atau sudah terkirim, jadi tidak dihapus.",
      );
      await history.refreshAll();
    } catch {
      setNotice("Draf belum dapat dihapus. Coba lagi dari antrean.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="w-full min-w-0">
      <WorkspacePageHeading
        compact
        className="mb-4 flex-row items-end justify-between gap-2 sm:gap-4"
        title="Antrean laporan"
        action={
          <button
            type="button"
            onClick={() => void reloadQueue()}
            disabled={!ownerId || reloadPending}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-peat-forest/10 bg-white px-3 text-xs font-semibold text-peat-forest shadow-xs transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={
                reloadPending
                  ? "animate-spin motion-reduce:animate-none"
                  : undefined
              }
              size={14}
            />
            Muat ulang
          </button>
        }
        description="Draf aman di perangkat. Pantau pengiriman dan riwayat laporan yang sudah diterima posko."
      />
      {ownerId || isCheckingOwner ? (
        <div className="space-y-4">
          <FieldQueueSummary
            hasOwner={Boolean(ownerId)}
            isLoading={
              isCheckingOwner || history.isLoadingLocal || initialHistoryLoading
            }
            isConnected={isConnected}
            isSyncing={isSyncing}
            waitingCount={waitingCount}
            sentCount={sentCount}
            onSync={syncAll}
          />
          <FieldOutboxSection
            isLoading={isCheckingOwner || history.isLoadingLocal}
            drafts={outboxReports}
            onDelete={setDeleteReportId}
          />
          <ServerReportHistorySection
            isConnected={isConnected}
            localReports={history.localReports}
            onPageChange={history.navigateServerPage}
            page={history.serverPage}
            pageSize={history.serverPageSize}
            reports={history.serverReports}
            status={isCheckingOwner ? "loading" : history.serverStatus}
            total={history.serverTotal}
            error={history.serverError}
          />
        </div>
      ) : (
        <FieldFeedback
          icon={ShieldCheck}
          title="Akun relawan belum siap"
          role="status"
        >
          {ownerStatusMessage(ownerStatus)}
        </FieldFeedback>
      )}

      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-draft-title"
        aria-describedby="delete-draft-description"
        onCancel={(event) => {
          event.preventDefault();
          setDeleteReportId(null);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xl backdrop:bg-black/40"
      >
        <h2
          id="delete-draft-title"
          className="font-heading text-2xl font-bold text-peat-forest"
        >
          Hapus draf lokal?
        </h2>
        <p
          id="delete-draft-description"
          className="mt-2 text-sm leading-6 text-muted-foreground"
        >
          Foto dan data draf ini akan dihapus dari perangkat. Laporan yang sudah
          terkirim ke posko tidak dapat dihapus dari sini.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-3">
          <button
            type="button"
            autoFocus
            disabled={isDeleting}
            onClick={() => setDeleteReportId(null)}
            className="inline-flex h-9 min-h-9 items-center justify-center rounded-xl border border-border px-4 text-xs font-semibold text-peat-forest transition hover:bg-peat-paper focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isDeleting || !pendingReport}
            onClick={() => void confirmDeleteDraft()}
            className="inline-flex h-9 min-h-9 items-center justify-center rounded-xl bg-destructive px-4 text-xs font-semibold text-white transition hover:bg-destructive/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest disabled:opacity-60"
          >
            {isDeleting ? "Menghapus…" : "Hapus draf"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
