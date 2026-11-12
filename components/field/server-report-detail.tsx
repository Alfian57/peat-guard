"use client";

import Image from "next/image";
import { ArrowLeft, MapPin, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { ServerReportDetail as ServerReportDetailDto } from "@/lib/client/offline/server-report-client";
import { ServerReportAiAnalysis } from "./server-report-ai-analysis";
import { ServerReportStatusHistory } from "./server-report-status-history";
import { CATEGORY_LABELS, HANDLING_LABELS } from "./server-report-labels";
import { APP_ROUTES } from "@/lib/routes";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ServerReportDetail({
  report,
  onRefresh,
  isRefreshing = false,
}: {
  report: ServerReportDetailDto;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const title = report.tags[0]
    ? report.tags[0]
    : report.aiCategory
      ? CATEGORY_LABELS[report.aiCategory]
      : "Temuan lapangan";

  return (
    <article className="mx-auto w-full max-w-xl px-4 pt-4 lg:max-w-4xl lg:px-0 lg:pt-0">
      <a
        href={APP_ROUTES.field.queue}
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline focus-visible:outline-2 focus-visible:outline-peat-green"
      >
        <ArrowLeft aria-hidden="true" size={17} /> Kembali ke antrean
      </a>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl leading-none font-bold text-peat-forest">
            {title}
          </h1>
        </div>
        {report.isDemoSample ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">
            Sampel demo
          </span>
        ) : null}
      </div>

      <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
        {report.hasPhoto && report.photoHref && !photoFailed ? (
          <Image
            src={report.photoHref}
            alt={
              report.isDemoSample
                ? "Foto sampel demo, bukan bukti kejadian"
                : "Foto laporan patroli"
            }
            fill
            unoptimized
            onError={() => setPhotoFailed(true)}
            className="object-cover"
          />
        ) : (
          <p className="grid h-full place-items-center p-5 text-sm text-muted-foreground">
            {report.hasPhoto
              ? "Foto privat tidak dapat dimuat."
              : "Laporan ini tidak menyertakan foto."}
          </p>
        )}
        {report.isDemoSample ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">
            Sampel demo · bukan bukti kejadian
          </span>
        ) : null}
      </div>

      <section
        className="mt-4 rounded-2xl border border-border bg-white p-4"
        aria-labelledby="server-status-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="server-status-title"
              className="font-semibold text-peat-forest"
            >
              Status laporan
            </h2>
            <p className="mt-1 text-sm text-muted-foreground" role="status">
              {HANDLING_LABELS[report.handlingStatus]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Diterima posko {formatDate(report.syncedAt)}
            </p>
          </div>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Muat ulang status laporan"
              className="grid size-11 shrink-0 place-items-center rounded-xl text-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
            >
              <RefreshCw
                aria-hidden="true"
                className={
                  isRefreshing ? "animate-spin motion-reduce:animate-none" : ""
                }
                size={18}
              />
            </button>
          ) : null}
        </div>
        <ServerReportStatusHistory report={report} />
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
          {formatDate(report.capturedAt)}
        </p>
        {report.nearestWaterDistanceM !== null ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Sumber air terdekat sekitar{" "}
            {Math.round(report.nearestWaterDistanceM)} meter.
          </p>
        ) : null}
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

      <ServerReportAiAnalysis report={report} />

      <p className="mt-4 mb-2 text-center font-mono text-[10px] text-muted-foreground">
        ID laporan: {report.id}
      </p>
    </article>
  );
}
