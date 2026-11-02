"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { QueuedFieldReport } from "@/lib/client/offline/types";

function useBlobUrl(blob: Blob): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    const frameId = window.requestAnimationFrame(() => setUrl(objectUrl));
    return () => {
      window.cancelAnimationFrame(frameId);
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
}

function syncLabel(report: QueuedFieldReport): string {
  if (report.syncState === "synced") return "Terkirim ke posko";
  if (report.syncState === "syncing") return "Sedang disinkronkan";
  if (report.syncState === "requires-auth") return "Perlu masuk ulang";
  if (report.syncState === "failed") return "Menunggu dicoba lagi";
  return "Menunggu sinkronisasi";
}

function formatCapturedAt(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ReportCard({ report }: { report: QueuedFieldReport }) {
  const imageUrl = useBlobUrl(report.photo);

  return (
    <a
      href={`/field/report?reportId=${encodeURIComponent(report.clientReportId)}`}
      className="flex min-h-[112px] items-center gap-3 rounded-2xl border border-border bg-white p-3 transition hover:border-peat-green/50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
    >
      <span className="relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-secondary">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={
              report.isDemoSample
                ? "Foto sampel demo laporan"
                : "Foto laporan patroli"
            }
            width={72}
            height={72}
            unoptimized
            className="size-full object-cover"
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-peat-forest">
            {report.tags[0] ?? "Temuan patroli"}
          </span>
          {report.isDemoSample ? (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">
              Sampel demo
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {formatCapturedAt(report.capturedAt)} · {syncLabel(report)}
        </span>
        <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
        </span>
      </span>
    </a>
  );
}
