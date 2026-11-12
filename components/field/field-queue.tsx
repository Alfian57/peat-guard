"use client";

import { CloudUpload, RefreshCw } from "lucide-react";
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
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const pendingReport = history.localReports.find(
    (report) => report.clientReportId === deleteReportId,
  );
  const reportHistory = splitReportHistory(
    history.serverReports,
    history.localReports,
  );
  const waitingCount = reportHistory.outboxReports.length;
  const sentCount =
    history.serverStatus === "loaded"
      ? history.serverTotal
      : history.localReports.filter((report) => report.syncState === "synced")
          .length;

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
    <div className="mx-auto w-full max-w-xl px-4 pt-4 lg:max-w-5xl lg:px-0 lg:pt-0">
      <h1 className="font-heading text-4xl leading-none font-bold text-peat-forest">
        Antrean laporan
      </h1>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">
        Draf menunggu aman di perangkat. Laporan yang sudah diterima posko
        tersedia di riwayat server saat online.
      </p>
      {!ownerId ? (
        <p
          className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950"
          role="status"
        >
          {ownerStatusMessage(ownerStatus)}
        </p>
      ) : null}

      <section
        className="mt-4 rounded-2xl border border-border bg-white p-4"
        aria-labelledby="queue-status-title"
      >
        <div className="flex items-start gap-3">
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-full ${isConnected ? "bg-secondary text-peat-green" : "bg-amber-100 text-amber-900"}`}
          >
            <CloudUpload aria-hidden="true" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="queue-status-title"
              className="font-semibold text-peat-forest"
            >
              {!ownerId
                ? "Akun belum diverifikasi"
                : isConnected
                  ? "Koneksi tersedia"
                  : "Sedang offline"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ownerId
                ? `${waitingCount} menunggu · ${sentCount} terkirim ke posko`
                : "Antrean disembunyikan sampai pemilik terverifikasi"}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!ownerId || !isConnected || isSyncing || waitingCount === 0}
          onClick={() => void syncAll()}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-peat-green px-4 text-sm font-bold text-white transition hover:bg-peat-forest focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          <RefreshCw
            aria-hidden="true"
            className={
              isSyncing ? "animate-spin motion-reduce:animate-none" : ""
            }
            size={18}
          />
          {isSyncing ? "Menyinkronkan…" : "Sinkronkan semua"}
        </button>
        {!isConnected ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Draf tetap dapat dibuka dan dihapus offline. Sinkronisasi berjalan
            saat koneksi tersedia.
          </p>
        ) : null}
      </section>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold text-peat-forest">
          Laporan lapangan
        </h2>
        <button
          type="button"
          onClick={() => void history.refreshAll()}
          disabled={history.isLoadingLocal}
          className="min-h-11 rounded-lg px-3 text-sm font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-peat-green disabled:opacity-60"
        >
          Muat ulang
        </button>
      </div>

      <FieldOutboxSection
        isLoading={history.isLoadingLocal}
        reports={history.localReports}
        onDelete={setDeleteReportId}
      />
      <ServerReportHistorySection
        hasOwner={Boolean(ownerId)}
        isConnected={isConnected}
        localReports={history.localReports}
        onPageChange={history.navigateServerPage}
        onRefresh={history.refreshServerHistory}
        page={history.serverPage}
        pageSize={history.serverPageSize}
        reports={history.serverReports}
        status={history.serverStatus}
        total={history.serverTotal}
        error={history.serverError}
      />

      <p className="mt-5 rounded-xl bg-secondary/70 px-4 py-3 text-xs leading-5 text-secondary-foreground">
        Antrean tersimpan di browser perangkat ini. Riwayat server hanya dimuat
        untuk akun relawan aktif; API dan foto privat tidak disimpan service
        worker.
      </p>

      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-draft-title"
        aria-describedby="delete-draft-description"
        onCancel={(event) => {
          event.preventDefault();
          setDeleteReportId(null);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-white p-5 shadow-xl backdrop:bg-black/40"
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
