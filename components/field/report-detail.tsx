"use client";

import Image from "next/image";
import { ArrowLeft, MapPin, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { useOwnedReport } from "./use-owned-report";
import { useServerReport } from "./use-server-report";
import { ServerReportDetail } from "./server-report-detail";
import { FieldReportDetailSkeleton } from "./field-report-detail-skeleton";
import { resolveReportDetailSource } from "@/lib/client/offline/server-report-client";
import type { QueuedFieldReport } from "@/lib/client/offline/types";
import { APP_ROUTES } from "@/lib/routes";

function usePhotoUrl(photo: Blob | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = photo ? URL.createObjectURL(photo) : null;
    const frameId = window.requestAnimationFrame(() => setUrl(objectUrl));
    return () => {
      window.cancelAnimationFrame(frameId);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo]);
  return url;
}

function reportStatus(report: QueuedFieldReport): string {
  if (report.syncState === "synced") return "Terkirim ke posko";
  if (report.syncState === "syncing") return "Sedang disinkronkan";
  if (report.syncState === "requires-auth") return "Perlu masuk ulang";
  if (report.syncState === "failed")
    return "Belum terkirim · dapat dicoba lagi";
  return "Tersimpan di perangkat · menunggu sinkronisasi";
}

export function ReportDetail({
  reportId,
  serverReportId,
}: {
  reportId: string | null;
  serverReportId: string | null;
}) {
  const {
    isConnected,
    isSyncing,
    refreshQueue,
    syncNow,
    ownerId,
    ownerStatus,
  } = useFieldShell();
  const localReport = useOwnedReport(reportId);
  const activeServerReportId =
    serverReportId ?? localReport.report?.serverReportId ?? null;
  const remoteReport = useServerReport(activeServerReportId);
  const detailSource = resolveReportDetailSource({
    isConnected,
    serverReport: remoteReport.report,
    localReport: localReport.report,
  });
  const report = detailSource.kind === "local" ? detailSource.report : null;
  const photoUrl = usePhotoUrl(report?.photo);

  async function retrySync() {
    await syncNow();
    await localReport.loadReport();
    await refreshQueue();
  }

  if (!ownerId) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-8">
        <p
          className="rounded-xl border border-border bg-white p-4 text-sm"
          role="status"
        >
          {ownerStatusMessage(ownerStatus)}
        </p>
        <a
          href={APP_ROUTES.field.home}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-peat-forest hover:underline"
        >
          <ArrowLeft aria-hidden="true" size={17} /> Kembali ke beranda
        </a>
        {serverReportId && isConnected ? (
          <button
            type="button"
            onClick={() => void remoteReport.loadReport()}
            disabled={remoteReport.status === "loading"}
            className="mt-2 flex min-h-11 items-center gap-2 text-sm font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={
                remoteReport.status === "loading"
                  ? "animate-spin motion-reduce:animate-none"
                  : ""
              }
              size={17}
            />
            Coba muat ulang
          </button>
        ) : null}
      </div>
    );
  }
  if (
    !report &&
    detailSource.kind === "unavailable" &&
    (localReport.isLoading || remoteReport.status === "loading")
  ) {
    return <FieldReportDetailSkeleton />;
  }
  if (detailSource.kind === "server") {
    return (
      <ServerReportDetail
        report={detailSource.report}
        onRefresh={() => void remoteReport.loadReport()}
        isRefreshing={remoteReport.status === "loading"}
      />
    );
  }
  if (!report) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-8">
        <p
          className="rounded-xl border border-border bg-white p-4 text-sm"
          role="status"
        >
          {remoteReport.error ??
            (!isConnected
              ? "Detail laporan server perlu koneksi. Tidak ada salinan lokal pada perangkat ini."
              : "Laporan tidak ditemukan atau tidak dapat diakses oleh akun ini.")}
        </p>
        <a
          href={APP_ROUTES.field.home}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-peat-forest hover:underline"
        >
          <ArrowLeft aria-hidden="true" size={17} /> Kembali ke beranda
        </a>
      </div>
    );
  }

  const editable = report.syncState !== "synced";

  return (
    <article className="mx-auto w-full max-w-xl px-4 pt-4 lg:max-w-4xl lg:px-0 lg:pt-0">
      <a
        href={APP_ROUTES.field.home}
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline focus-visible:outline-2 focus-visible:outline-peat-green"
      >
        <ArrowLeft aria-hidden="true" size={17} /> Kembali ke beranda
      </a>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl leading-none font-bold text-peat-forest">
            {report.tags[0] ?? "Temuan lapangan"}
          </h1>
        </div>
        {report.isDemoSample ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">
            Sampel demo
          </span>
        ) : null}
      </div>
      {report.syncState === "synced" &&
      report.serverReportId &&
      (!isConnected || remoteReport.error) ? (
        <div
          className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
          role="status"
        >
          {isConnected
            ? "Detail server tidak tersedia. Salinan pada perangkat ini tetap dapat dibuka."
            : "Offline. Detail triase server memerlukan koneksi; salinan pada perangkat ini tetap dapat dibuka."}
          {isConnected ? (
            <button
              type="button"
              onClick={() => void remoteReport.loadReport()}
              disabled={remoteReport.status === "loading"}
              className="mt-2 block min-h-11 font-semibold underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
            >
              Coba muat ulang detail
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={
              report.isDemoSample
                ? "Foto sampel demo, bukan bukti kejadian"
                : "Foto laporan patroli"
            }
            fill
            unoptimized
            className="object-cover"
          />
        ) : null}
        {report.isDemoSample ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">
            Sampel demo · bukan bukti kejadian
          </span>
        ) : null}
      </div>

      <section
        className="mt-4 rounded-2xl border border-border bg-white p-4"
        aria-labelledby="sync-title"
      >
        <h2 id="sync-title" className="font-semibold text-peat-forest">
          Status laporan
        </h2>
        <p className="mt-1 text-sm text-muted-foreground" role="status">
          {reportStatus(report)}
        </p>
        {report.syncError ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {report.syncError}
          </p>
        ) : null}
        {report.syncState !== "synced" ? (
          <button
            type="button"
            onClick={() => void retrySync()}
            disabled={isSyncing}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-peat-green px-4 text-sm font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={
                isSyncing ? "animate-spin motion-reduce:animate-none" : ""
              }
              size={17}
            />
            {isSyncing ? "Mencoba sinkronisasi…" : "Coba sinkronkan lagi"}
          </button>
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-white p-4">
        <h2 className="font-semibold text-peat-forest">Lokasi dan waktu</h2>
        <p className="mt-2 flex items-center gap-2 font-mono text-sm text-peat-forest">
          <MapPin aria-hidden="true" size={16} /> {report.latitude.toFixed(6)},{" "}
          {report.longitude.toFixed(6)}
        </p>
        {report.accuracyMeters !== null ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Akurasi GPS sekitar {report.accuracyMeters} meter.
          </p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("id-ID", {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "Asia/Jakarta",
          }).format(new Date(report.capturedAt))}
        </p>
      </section>

      {report.tags.length > 0 || report.fieldNotes ? (
        <section className="mt-4 rounded-2xl border border-border bg-white p-4">
          <h2 className="font-semibold text-peat-forest">Catatan lapangan</h2>
          {report.tags.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {report.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1 text-xs text-peat-forest"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          {report.fieldNotes ? (
            <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">
              {report.fieldNotes}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-4 rounded-2xl border border-border bg-white p-4">
        <h2 className="flex items-center gap-2 font-semibold text-peat-forest">
          <Sparkles aria-hidden="true" size={17} /> Analisis AI
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {report.aiConsent
            ? "Izin diberikan. Analisis diproses setelah laporan diterima posko."
            : "Analisis dilewati karena izin tidak diberikan."}
        </p>
      </section>

      {editable ? (
        <a
          href={`${APP_ROUTES.field.report}?reportId=${encodeURIComponent(report.clientReportId)}&mode=edit`}
          className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-peat-green px-4 text-sm font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
        >
          <Pencil aria-hidden="true" size={17} /> Edit laporan tersimpan
        </a>
      ) : null}
      <p className="mt-4 mb-2 text-center font-mono text-[10px] text-muted-foreground">
        ID lokal: {report.clientReportId}
      </p>
    </article>
  );
}
