"use client";

import {
  ClipboardList,
  Plus,
  ShieldCheck,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { Skeleton } from "@/components/ui/skeleton";
import {
  findLocalReportForServer,
  splitReportHistory,
} from "@/lib/client/offline/server-report-client";
import { APP_ROUTES } from "@/lib/routes";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { FieldFeedback } from "./field-feedback";
import { FieldPwaPanel } from "./field-pwa-panel";
import { FieldCaptureGuide } from "./field-capture-guide";
import { FieldHandlingGuide } from "./field-handling-guide";
import { FieldReportListSkeleton } from "./field-report-list-skeleton";
import { ReportCard } from "./report-card";
import { ServerReportCard } from "./server-report-card";
import { useFieldReportHistory } from "./use-field-report-history";

const recentReportGrid = "mt-2 grid gap-2 sm:grid-cols-2";

export function FieldHome() {
  const { ownerId, ownerStatus, isConnected, pwa } = useFieldShell();
  const {
    isLoadingLocal,
    localReports,
    serverReports,
    serverStatus,
    serverTotal,
  } = useFieldReportHistory();
  const { outboxReports, localSentFallback } = splitReportHistory(
    serverReports,
    localReports,
  );
  const isCheckingOwner = ownerStatus === "loading";
  const hasServerHistory = serverStatus === "loaded";
  const isLoading =
    isCheckingOwner || isLoadingLocal || serverStatus === "loading";
  const hasServerCount = hasServerHistory || serverReports.length > 0;
  const localRecent = hasServerHistory
    ? outboxReports
    : [...outboxReports, ...localSentFallback];
  const recentReports = [
    ...serverReports.map((report) => ({ kind: "server" as const, report })),
    ...localRecent.map((report) => ({ kind: "local" as const, report })),
  ]
    .sort(
      (left, right) =>
        Date.parse(right.report.capturedAt) -
        Date.parse(left.report.capturedAt),
    )
    .slice(0, 4);

  return (
    <div className="w-full min-w-0">
      <WorkspacePageHeading
        compact
        className="mb-4 gap-2 sm:gap-4"
        title="Beranda relawan"
        description="Catat temuan patroli dan pantau pengirimannya ke posko."
        action={
          <a
            href={APP_ROUTES.field.createReport}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-peat-forest px-3.5 text-xs font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
          >
            <Plus aria-hidden="true" size={15} />
            Lapor temuan
          </a>
        }
      />
      <div className="grid gap-3 xl:grid-cols-2">
        <section
          className="flex min-w-0 flex-col rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs"
          aria-labelledby="readiness-title"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              aria-hidden="true"
              className="shrink-0 text-peat-green"
              size={18}
            />
            <h2
              id="readiness-title"
              className="text-sm font-semibold text-peat-forest"
            >
              {ownerId || isCheckingOwner
                ? "Ringkasan patroli"
                : "Akun relawan belum siap"}
            </h2>
          </div>
          {ownerId || isCheckingOwner ? (
            <dl className="mt-3 grid flex-1 grid-cols-2 items-center divide-x divide-peat-forest/10 rounded-xl border border-peat-forest/10">
              <div className="px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">
                  Draf di perangkat
                </dt>
                <dd className="font-heading text-3xl font-bold text-peat-forest">
                  {isCheckingOwner || isLoadingLocal ? (
                    <Skeleton
                      className="mt-1 h-7 w-9 bg-peat-forest/10 motion-reduce:animate-none"
                      role="status"
                      aria-label="Memuat jumlah draf"
                    />
                  ) : (
                    outboxReports.length
                  )}
                </dd>
              </div>
              <div className="px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">
                  {hasServerCount || isLoading
                    ? "Terkirim ke posko"
                    : "Terkirim dari perangkat ini"}
                </dt>
                <dd className="font-heading text-3xl font-bold text-peat-forest">
                  {hasServerCount ? (
                    serverTotal
                  ) : isLoading ? (
                    <Skeleton
                      className="mt-1 h-7 w-9 bg-peat-forest/10 motion-reduce:animate-none"
                      role="status"
                      aria-label="Memuat jumlah laporan terkirim"
                    />
                  ) : (
                    localSentFallback.length
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p
              className="mt-2 text-sm leading-5 text-muted-foreground"
              role="status"
            >
              {ownerStatusMessage(ownerStatus)}
            </p>
          )}
        </section>
        <FieldPwaPanel pwa={pwa} />
      </div>

      <div
        className={
          ownerId || isCheckingOwner
            ? "mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
            : "mt-4"
        }
      >
        {ownerId || isCheckingOwner ? (
          <section className="min-w-0" aria-labelledby="recent-reports-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="recent-reports-title"
                className="font-heading text-2xl font-bold text-peat-forest"
              >
                Laporan terbaru
              </h2>
              <a
                href={APP_ROUTES.field.queue}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-peat-forest/10 bg-white px-3 text-xs font-semibold text-peat-forest shadow-xs transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
              >
                Lihat antrean
              </a>
            </div>

            {!isCheckingOwner &&
            (serverStatus === "error" || serverStatus === "unavailable") ? (
              <FieldFeedback
                className="mt-2"
                icon={isConnected ? TriangleAlert : WifiOff}
                title={
                  isConnected
                    ? "Riwayat posko belum tersedia"
                    : "Riwayat perlu koneksi"
                }
                role="status"
              >
                {isConnected
                  ? "Buka antrean untuk memuat ulang riwayat posko."
                  : "Hubungkan perangkat untuk memuat riwayat dari posko."}
              </FieldFeedback>
            ) : null}

            {recentReports.length ? (
              <div className={recentReportGrid}>
                {recentReports.map((entry) =>
                  entry.kind === "server" ? (
                    <ServerReportCard
                      key={entry.report.id}
                      report={entry.report}
                      localReportId={
                        findLocalReportForServer(entry.report.id, localReports)
                          ?.clientReportId
                      }
                    />
                  ) : (
                    <ReportCard
                      key={entry.report.clientReportId}
                      report={entry.report}
                    />
                  ),
                )}
              </div>
            ) : isLoading ? (
              <FieldReportListSkeleton
                className={recentReportGrid}
                count={4}
                label="Memuat laporan terbaru"
              />
            ) : hasServerHistory ? (
              <FieldFeedback
                className="mt-2"
                icon={ClipboardList}
                title="Belum ada laporan patroli"
                variant="empty"
              >
                Pilih Lapor temuan untuk mencatat hasil patroli pertama Anda.
              </FieldFeedback>
            ) : null}
          </section>
        ) : null}
        <FieldHandlingGuide />
      </div>
      <div className="mt-3">
        <FieldCaptureGuide />
      </div>
    </div>
  );
}
