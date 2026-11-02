import Image from "next/image";
import { MapPin, ShieldAlert } from "lucide-react";

import type { MrvLedgerRow } from "@/lib/server/mrv/contracts";

import {
  formatCarbon,
  formatDateTime,
  formatDecimal,
} from "../audit-formatters";

const aiCategoryLabels: Record<string, string> = {
  API_AKTIF: "Api aktif",
  AMAN_TERKENDALI: "Aman terkendali",
  ASAP_GAMBUT: "Asap gambut",
  SEKAT_KANAL_KERING: "Sekat kanal kering",
};

const aiUrgencyLabels: Record<string, string> = {
  KRITIS: "Kritis",
  RENDAH: "Rendah",
  WASPADA: "Waspada",
};

const aiStateLabels: Record<string, string> = {
  COMPLETED: "Selesai",
  FAILED: "Gagal",
  PENDING: "Menunggu",
  SKIPPED: "Tidak dianalisis",
};

const handlingStatusLabels: Record<string, string> = {
  DALAM_PENANGANAN: "Ditangani",
  MENUNGGU_TINDAKAN: "Menunggu",
  SELESAI: "Selesai",
};

function statusClass(status: string): string {
  if (status === "SELESAI") return "bg-safe/10 text-safe";
  if (status === "DALAM_PENANGANAN") return "bg-blue-50 text-blue-800";
  return "bg-warning/10 text-warning";
}

function statusLabel(status: string | null): string {
  if (!status) return "Laporan dibuat";
  return handlingStatusLabels[status] ?? status.replaceAll("_", " ");
}

function AiTriage({ row }: { row: MrvLedgerRow }) {
  const category = row.aiTriage.category;
  const urgency = row.aiTriage.urgency;
  const confidence = row.aiTriage.confidence;

  return (
    <div className="min-w-36">
      <p className="font-semibold text-peat-forest">
        {category
          ? (aiCategoryLabels[category] ?? category)
          : "Belum ada klasifikasi"}
      </p>
      {urgency ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldAlert aria-hidden="true" size={13} />
          {aiUrgencyLabels[urgency] ?? urgency}
          {confidence !== null ? ` · ${formatDecimal(confidence * 100)}%` : ""}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">
        Triase: {aiStateLabels[row.aiTriage.state ?? ""] ?? "Belum tersedia"}
      </p>
    </div>
  );
}

function PhotoEvidence({ row }: { row: MrvLedgerRow }) {
  if (!row.hasPhoto || !row.photoHref) {
    return (
      <span className="text-xs text-muted-foreground">Foto belum tersedia</span>
    );
  }

  return (
    <a
      aria-label={`Buka foto bukti laporan ${row.reportId.slice(0, 8)}`}
      className="group inline-flex flex-col items-start gap-1 rounded-lg text-xs font-semibold text-peat-green underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
      href={row.photoHref}
      rel="noreferrer"
      target="_blank"
    >
      <Image
        alt=""
        className="size-16 rounded-lg border border-border object-cover transition group-hover:brightness-95"
        height={64}
        src={row.photoHref}
        unoptimized
        width={64}
      />
      Lihat bukti
    </a>
  );
}

function StatusHistory({ row }: { row: MrvLedgerRow }) {
  return (
    <details className="mt-2 max-w-52 rounded-lg border border-border bg-white px-2.5 py-2 text-xs">
      <summary className="min-h-8 cursor-pointer font-semibold text-peat-green">
        Riwayat status ({row.statusHistory.length})
      </summary>
      {row.statusHistory.length > 0 ? (
        <ol className="mt-2 space-y-2 border-l border-peat-green/20 pl-3">
          {row.statusHistory.map((event) => (
            <li key={event.eventId}>
              <time
                className="block text-muted-foreground"
                dateTime={event.createdAt}
              >
                {formatDateTime(event.createdAt)} · {event.actorRole}
              </time>
              <span className="font-semibold text-peat-forest">
                {statusLabel(event.previousStatus)} →{" "}
                {statusLabel(event.nextStatus)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-muted-foreground">
          Belum ada perubahan status.
        </p>
      )}
    </details>
  );
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
          {row.isDemoSample ? "Sampel demo" : "Laporan lapangan"}
        </span>
        {row.isDemoSample ? (
          <span className="mt-1 inline-flex rounded-full bg-peat-sun/20 px-2 py-0.5 text-[0.65rem] font-semibold text-peat-forest">
            Data demo
          </span>
        ) : null}
      </th>
      <td className="min-w-36 px-4 py-4 text-xs">
        <span className="block font-semibold text-peat-forest">Rekam</span>
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
      <td className="min-w-28 px-4 py-4">
        <PhotoEvidence row={row} />
        <p className="mt-2 text-xs text-muted-foreground">
          Bukti:{" "}
          {row.evidenceStatus === "complete" ? "lengkap" : "belum lengkap"}
        </p>
      </td>
      <td className="min-w-44 px-4 py-4">
        <AiTriage row={row} />
      </td>
      <td className="min-w-44 px-4 py-4">
        <span
          className={`inline-flex min-h-8 items-center rounded-lg px-3 text-xs font-semibold ${statusClass(row.handlingStatus)}`}
        >
          {statusLabel(row.handlingStatus)}
        </span>
        <StatusHistory row={row} />
      </td>
      <td className="min-w-40 px-4 py-4">
        {zone ? (
          <>
            <p className="font-mono text-sm font-semibold text-peat-green">
              {formatCarbon(zone.estimatedCarbonTons)}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Estimasi zona · konteks saja
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {zone.zoneName}
            </p>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            Tidak ada zona disetujui
          </span>
        )}
      </td>
    </tr>
  );
}
