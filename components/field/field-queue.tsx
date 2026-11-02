"use client";

import { CloudUpload, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { ReportCard } from "./report-card";
import { listQueuedReports } from "@/lib/client/offline/report-store";
import type { QueuedFieldReport } from "@/lib/client/offline/types";

/* eslint-disable @next/next/no-html-link-for-pages -- Full navigations let the service worker serve cached field shells offline. */

export function FieldQueue() {
  const {
    isConnected,
    isSyncing,
    ownerId,
    ownerStatus,
    queueCount,
    refreshQueue,
    setNotice,
    syncNow,
  } = useFieldShell();
  const [reportSnapshot, setReportSnapshot] = useState<{
    ownerId: string | null;
    reports: QueuedFieldReport[];
    loaded: boolean;
  }>({ ownerId: null, reports: [], loaded: false });
  const reports =
    reportSnapshot.ownerId === ownerId ? reportSnapshot.reports : [];
  const isLoading = Boolean(
    ownerId && (reportSnapshot.ownerId !== ownerId || !reportSnapshot.loaded),
  );

  const loadReports = useCallback(async () => {
    if (!ownerId) {
      setReportSnapshot({ ownerId: null, reports: [], loaded: true });
      return;
    }
    try {
      setReportSnapshot({
        ownerId,
        reports: await listQueuedReports(ownerId),
        loaded: true,
      });
    } catch {
      setReportSnapshot({ ownerId, reports: [], loaded: true });
      setNotice(
        "Antrean lokal tidak dapat dibuka. Laporan tetap tersimpan, muat ulang halaman untuk mencoba lagi.",
      );
    }
  }, [ownerId, setNotice]);

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadReports(), 0);
    return () => window.clearTimeout(timerId);
  }, [loadReports, queueCount]);

  async function syncAll() {
    await syncNow();
    await loadReports();
    await refreshQueue();
  }

  const waitingCount = reports.filter(
    (report) => report.syncState !== "synced",
  ).length;
  const sentCount = reports.length - waitingCount;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-5">
      <p className="text-sm text-muted-foreground">
        Penyimpanan pada perangkat ini
      </p>
      <h1 className="mt-1 font-heading text-4xl leading-none font-bold text-peat-forest">
        Antrean laporan
      </h1>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">
        Laporan menunggu aman di perangkat dan dapat dikirim ulang saat jaringan
        kembali.
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
            Buka simulasi offline untuk berlatih; sinkronisasi akan berjalan
            saat simulasi dimatikan dan koneksi tersedia.
          </p>
        ) : null}
      </section>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold text-peat-forest">
          Semua laporan
        </h2>
        <button
          type="button"
          onClick={() => void loadReports()}
          disabled={isLoading}
          className="min-h-11 rounded-lg px-3 text-sm font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-peat-green"
        >
          Muat ulang
        </button>
      </div>
      {isLoading ? (
        <div
          className="mt-3 rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground"
          role="status"
        >
          Membuka antrean…
        </div>
      ) : reports.length ? (
        <div className="mt-3 space-y-3">
          {reports.map((report) => (
            <div key={report.clientReportId}>
              <ReportCard report={report} />
              {report.syncError ? (
                <p className="px-2 pt-2 text-xs text-destructive" role="status">
                  {report.syncError}
                </p>
              ) : null}
              {report.aiState === "skipped" ? (
                <p className="px-2 pt-1 text-xs text-muted-foreground">
                  Analisis AI dilewati sesuai pilihan relawan.
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <section className="mt-3 rounded-2xl border border-dashed border-peat-green/40 bg-white p-5 text-center">
          <h3 className="font-semibold text-peat-forest">
            Antrean masih kosong
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Laporan patroli yang dibuat akan muncul di sini.
          </p>
          <a
            href="/field/reports/create"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-peat-green px-4 text-sm font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest"
          >
            Buat laporan
          </a>
        </section>
      )}
      <p className="mt-5 rounded-xl bg-secondary/70 px-4 py-3 text-xs leading-5 text-secondary-foreground">
        Antrean tersimpan di browser perangkat ini. Foto laporan tidak
        dimasukkan ke cache service worker.
      </p>
    </div>
  );
}
