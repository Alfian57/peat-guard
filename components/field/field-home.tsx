"use client";

import { ClipboardList, CloudUpload, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ownerStatusMessage, useFieldShell } from "./field-app-shell";
import { ReportCard } from "./report-card";
import { FieldReportCardSkeleton } from "./field-report-card-skeleton";
import { listQueuedReports } from "@/lib/client/offline/report-store";
import type { QueuedFieldReport } from "@/lib/client/offline/types";
import { APP_ROUTES } from "@/lib/routes";

export function FieldHome() {
  const { ownerId, ownerStatus, queueCount, setNotice, isConnected } =
    useFieldShell();
  const activeOwnerIdentityRef = useRef<{ ownerId: string | null } | null>(
    null,
  );
  useLayoutEffect(() => {
    const identity = { ownerId };
    activeOwnerIdentityRef.current = identity;
    return () => {
      if (activeOwnerIdentityRef.current === identity) {
        activeOwnerIdentityRef.current = null;
      }
    };
  }, [ownerId]);
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

  useEffect(() => {
    if (!ownerId) return;
    const identity = activeOwnerIdentityRef.current;
    if (!identity || identity.ownerId !== ownerId) return;
    let isActive = true;
    void listQueuedReports(ownerId)
      .then((reports) => {
        if (!isActive || activeOwnerIdentityRef.current !== identity) return;
        setReportSnapshot({ ownerId, reports, loaded: true });
      })
      .catch(() => {
        if (!isActive || activeOwnerIdentityRef.current !== identity) return;
        setReportSnapshot({ ownerId, reports: [], loaded: true });
        setNotice(
          "Laporan lokal tidak dapat dibuka. Periksa ruang penyimpanan browser.",
        );
      });
    return () => {
      isActive = false;
    };
  }, [ownerId, queueCount, setNotice]);

  const pendingReports = reports.filter(
    (report) => report.syncState !== "synced",
  );
  const syncedReports = reports.filter(
    (report) => report.syncState === "synced",
  );

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-4 lg:max-w-5xl lg:px-0 lg:pt-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl leading-none font-bold text-peat-forest">
            Beranda relawan
          </h1>
        </div>
        <span className="mt-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          MPA · demo
        </span>
      </div>

      <section
        className="rounded-2xl bg-peat-forest p-4 text-white"
        aria-labelledby="readiness-title"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-peat-leaf"
            size={24}
          />
          <div>
            <h2 id="readiness-title" className="font-semibold">
              {ownerId ? "Siap mencatat patroli" : "Akun relawan belum siap"}
            </h2>
            <p className="mt-1 text-sm text-white/85">
              {!ownerId
                ? ownerStatusMessage(ownerStatus)
                : isConnected
                  ? "Laporan tersimpan di perangkat dan dapat dikirim ke posko."
                  : "Laporan tetap tersimpan di perangkat saat jaringan terputus."}
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs">
          <CloudUpload aria-hidden="true" size={16} />
          {queueCount === 0
            ? "Tidak ada laporan menunggu sinkronisasi."
            : `${queueCount} laporan menunggu sinkronisasi.`}
        </p>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <section className="rounded-2xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Laporan tersimpan</p>
          <p className="mt-1 font-heading text-4xl font-bold text-peat-forest">
            {!ownerId || isLoading ? "—" : reports.length}
          </p>
          <p className="text-xs text-muted-foreground">di perangkat ini</p>
        </section>
        <section className="rounded-2xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Tinjauan posko</p>
          <p className="mt-1 font-heading text-2xl leading-tight font-bold text-peat-forest">
            {!ownerId || isLoading ? "—" : `${syncedReports.length} terkirim`}
          </p>
          <p className="text-xs text-muted-foreground">
            dampak dihitung setelah verifikasi
          </p>
        </section>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold text-peat-forest">
          Laporan terbaru
        </h2>
        <a
          href={APP_ROUTES.field.queue}
          className="inline-flex h-8 min-h-8 items-center justify-center rounded-full border border-border bg-white px-3 text-xs font-semibold text-peat-forest shadow-xs transition-colors hover:bg-peat-paper hover:text-peat-green focus-visible:outline-2 focus-visible:outline-peat-green"
        >
          Lihat antrean
        </a>
      </div>

      {!ownerId ? (
        <section
          className="mt-3 rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground"
          role="status"
        >
          {ownerStatusMessage(ownerStatus)}
        </section>
      ) : isLoading ? (
        <div className="mt-3 space-y-3">
          <FieldReportCardSkeleton />
          <FieldReportCardSkeleton />
        </div>
      ) : reports.length ? (
        <div className="mt-3 space-y-3">
          {reports.slice(0, 4).map((report) => (
            <ReportCard key={report.clientReportId} report={report} />
          ))}
        </div>
      ) : (
        <section className="mt-3 rounded-2xl border border-dashed border-peat-green/40 bg-white p-5 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-peat-green">
            <ClipboardList aria-hidden="true" size={23} />
          </span>
          <h3 className="mt-3 font-semibold text-peat-forest">
            Belum ada laporan patroli
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Ambil foto temuan atau gunakan sampel demo untuk mencoba alur
            pelaporan.
          </p>
          <a
            href={APP_ROUTES.field.createReport}
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-peat-green px-4 py-2 text-sm font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest"
          >
            <Plus aria-hidden="true" size={18} />
            Buat laporan
          </a>
        </section>
      )}

      {pendingReports.length > 0 ? (
        <a
          href={APP_ROUTES.field.queue}
          className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-peat-forest focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
        >
          <CloudUpload aria-hidden="true" size={18} />
          Sinkronkan {pendingReports.length} laporan
        </a>
      ) : null}

      <p className="mt-5 rounded-xl bg-secondary/70 px-4 py-3 text-xs leading-5 text-secondary-foreground">
        Foto sampel diberi label <strong>Sampel demo</strong> dan bukan bukti
        kejadian nyata.
      </p>
    </div>
  );
}
