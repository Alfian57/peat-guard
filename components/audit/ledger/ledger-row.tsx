import { MapPin } from "lucide-react";

import type { MrvLedgerRow } from "@/lib/server/mrv/contracts";
import { handlingStatusLabel } from "@/lib/report-labels";

import {
  formatCarbon,
  formatDateTime,
  formatDecimal,
} from "../audit-formatters";
import { LedgerAiTriage } from "./ledger-ai-triage";
import { LedgerPhotoViewer } from "./ledger-photo-viewer";
import { LedgerReviewControl } from "./ledger-review-control";
import { LedgerStatusHistory } from "./ledger-status-history";

function statusClass(status: string): string {
  if (status === "SELESAI") return "bg-safe/10 text-safe";
  if (status === "DALAM_PENANGANAN") return "bg-blue-50 text-blue-800";
  return "bg-warning/10 text-warning";
}

export function LedgerRow({ row }: { row: MrvLedgerRow }) {
  const shortId = row.reportId.slice(0, 8);
  const zone = row.zoneImpactContext;

  return (
    <tr className="align-top transition-colors hover:bg-peat-paper/40">
      <th className="min-w-36 px-4 py-4 text-left" scope="row">
        <code className="font-mono text-sm font-semibold text-peat-forest">
          {shortId}…
        </code>
        <span className="mt-2 block text-xs font-normal text-muted-foreground">
          {row.isDemoSample ? "Sampel demo" : "Operasional"}
        </span>
      </th>
      <td className="min-w-36 px-4 py-4 text-xs">
        <span className="block font-semibold text-peat-forest">
          Waktu rekam
        </span>
        <time
          className="mt-1 block text-muted-foreground"
          dateTime={row.capturedAt}
        >
          {formatDateTime(row.capturedAt)}
        </time>
        <span className="mt-3 block font-semibold text-peat-forest">
          Diterima server
        </span>
        <time
          className="mt-1 block text-muted-foreground"
          dateTime={row.createdAt}
        >
          {formatDateTime(row.createdAt)}
        </time>
        <span className="mt-3 block font-semibold text-peat-forest">
          Sinkronisasi
        </span>
        <time
          className="mt-1 block text-muted-foreground"
          dateTime={row.syncedAt}
        >
          {formatDateTime(row.syncedAt)}
        </time>
      </td>
      <td className="min-w-52 px-4 py-4">
        <div className="flex items-start gap-2 text-sm font-semibold text-peat-forest">
          <MapPin
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-peat-green"
            size={15}
          />
          {row.villageName ?? "Desa tidak diketahui"}
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {row.coordinates.latitude.toFixed(4)},{" "}
          {row.coordinates.longitude.toFixed(4)}
        </p>
        <p className="mt-2 text-xs font-semibold text-warning">
          Koordinat tercatat · belum diverifikasi
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Akurasi perangkat:{" "}
          {row.coordinates.accuracyMeters === null
            ? "belum tersedia"
            : `${formatDecimal(row.coordinates.accuracyMeters)} m`}
        </p>
      </td>
      <td className="min-w-40 px-4 py-4 text-sm text-peat-forest">
        {row.zoneName ?? "Tidak ada zona gambut"}
      </td>
      <td className="min-w-28 px-4 py-4">
        <LedgerPhotoViewer
          capturedAtLabel={formatDateTime(row.capturedAt)}
          row={{
            capturedAt: row.capturedAt,
            coordinates: {
              accuracyMeters: row.coordinates.accuracyMeters,
              latitude: row.coordinates.latitude,
              longitude: row.coordinates.longitude,
            },
            evidenceStatus: row.evidenceStatus,
            hasPhoto: row.hasPhoto,
            photoHref: row.photoHref,
            reportId: row.reportId,
            villageName: row.villageName,
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {row.evidenceStatus === "complete"
            ? "Koordinat dan foto tersedia"
            : "Belum lengkap"}
        </p>
      </td>
      <td className="min-w-44 px-4 py-4">
        <LedgerAiTriage row={row} />
      </td>
      <td className="min-w-44 px-4 py-4">
        <span
          className={`inline-flex min-h-8 items-center rounded-lg px-3 text-xs font-semibold ${statusClass(row.handlingStatus)}`}
        >
          {handlingStatusLabel(row.handlingStatus)}
        </span>
      </td>
      <td className="min-w-40 px-4 py-4">
        {zone ? (
          <>
            <p className="font-mono text-sm font-semibold text-peat-green">
              {formatCarbon(zone.estimatedCarbonTons)}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Konteks zona; tidak dihitung dari patroli
            </p>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            Tidak ada zona disetujui
          </span>
        )}
      </td>
      <td className="min-w-36 px-2 py-4">
        <div className="mx-auto grid w-full max-w-36 grid-cols-2 justify-items-center gap-x-2 gap-y-1.5 rounded-xl border border-peat-forest/10 bg-peat-paper/50 p-2">
          <LedgerStatusHistory row={row} />
          <LedgerReviewControl
            auditHistory={row.auditHistory}
            coordinates={row.coordinates}
            hasPhoto={row.hasPhoto}
            photoHref={row.photoHref}
            reportId={row.reportId}
          />
        </div>
      </td>
    </tr>
  );
}
