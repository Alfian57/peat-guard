"use client";

import { ArrowLeft, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { useOwnedReport } from "./use-owned-report";
import { useServerReport } from "./use-server-report";
import { ServerReportDetail } from "./server-report-detail";
import { FieldReportDetailSkeleton } from "./field-report-detail-skeleton";
import { resolveReportDetailSource } from "@/lib/client/offline/server-report-client";
import type { QueuedFieldReport } from "@/lib/client/offline/types";
import { FieldReportEvidence } from "./field-report-evidence";
import { FieldReportLocationDetails } from "./field-report-location-details";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { isRemovableLocalDraft } from "@/lib/client/offline/report-store";
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

  if (ownerStatus === "loading") {
    return <FieldReportDetailSkeleton local={!serverReportId} />;
  }

  if (!ownerId) {
    return (
      <div className="w-full min-w-0">
        <p
          className="rounded-xl border border-peat-forest/10 bg-white p-4 text-sm"
          role="status"
        >
          {ownerStatusMessage(ownerStatus)}
        </p>
        <a
          href={APP_ROUTES.field.queue}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-peat-forest hover:underline"
        >
          <ArrowLeft aria-hidden="true" size={17} /> Kembali ke antrean
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
    return <FieldReportDetailSkeleton local={!activeServerReportId} />;
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
      <div className="w-full min-w-0">
        <p
          className="rounded-xl border border-peat-forest/10 bg-white p-4 text-sm"
          role="status"
        >
          {remoteReport.error ??
            (!isConnected
              ? "Detail laporan server perlu koneksi. Tidak ada salinan lokal pada perangkat ini."
              : "Laporan tidak ditemukan atau tidak dapat diakses oleh akun ini.")}
        </p>
        <a
          href={APP_ROUTES.field.queue}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-peat-forest hover:underline"
        >
          <ArrowLeft aria-hidden="true" size={17} /> Kembali ke antrean
        </a>
      </div>
    );
  }

  const editable = isRemovableLocalDraft(report);

  return (
    <article className="w-full min-w-0">
      <a
        href={APP_ROUTES.field.queue}
        className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline focus-visible:outline-2 focus-visible:outline-peat-green"
      >
        <ArrowLeft aria-hidden="true" size={17} /> Kembali ke antrean
      </a>
      <WorkspacePageHeading
        compact
        className="mb-4 gap-2"
        title={report.tags[0] ?? "Temuan lapangan"}
        action={
          report.isDemoSample ? (
            <span className="rounded-full bg-peat-sun/20 px-3 py-1 text-xs font-semibold text-peat-forest">
              Sampel demo
            </span>
          ) : undefined
        }
      />
      {report.syncState === "synced" &&
      report.serverReportId &&
      (!isConnected || remoteReport.error) ? (
        <div
          className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
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
      <div className="grid items-stretch gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <FieldReportEvidence
          photoHref={photoUrl}
          photoMessage="Menyiapkan foto dari perangkat…"
          isPhotoLoading={!photoUrl}
          isDemoSample={report.isDemoSample}
          fieldNotes={report.fieldNotes}
          tags={report.tags}
        />
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <section
            className="rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs"
            aria-labelledby="sync-title"
          >
            <h2
              id="sync-title"
              className="font-heading text-2xl font-bold text-peat-forest"
            >
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
                className="mt-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-peat-forest px-3 text-xs font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest disabled:opacity-60"
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

          <FieldReportLocationDetails
            latitude={report.latitude}
            longitude={report.longitude}
            accuracyMeters={report.accuracyMeters}
            capturedAt={report.capturedAt}
          />

          <section className="rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs xl:flex-1">
            <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-peat-forest">
              <Sparkles aria-hidden="true" size={17} /> Analisis AI
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {report.aiConsent
                ? "Izin diberikan. Analisis diproses setelah laporan diterima posko."
                : "Analisis dilewati karena izin tidak diberikan."}
            </p>
          </section>
        </div>
      </div>

      {editable ? (
        <a
          href={`${APP_ROUTES.field.report}?reportId=${encodeURIComponent(report.clientReportId)}&mode=edit`}
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-peat-green px-3 text-xs font-semibold text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
        >
          <Pencil aria-hidden="true" size={17} /> Edit laporan tersimpan
        </a>
      ) : null}
      <p className="mt-4 mb-2 text-center font-mono text-[10px] wrap-anywhere text-muted-foreground">
        ID lokal: {report.clientReportId}
      </p>
    </article>
  );
}
