"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useId } from "react";

import type { MrvLedgerRow } from "@/lib/server/mrv/contracts";

import { LedgerDialog, useLedgerDialog } from "./ledger-dialog";

type LedgerPhotoViewerProps = {
  capturedAtLabel: string;
  row: Pick<
    MrvLedgerRow,
    | "capturedAt"
    | "evidenceStatus"
    | "hasPhoto"
    | "photoHref"
    | "reportId"
    | "villageName"
  > & {
    coordinates: Pick<
      MrvLedgerRow["coordinates"],
      "accuracyMeters" | "latitude" | "longitude"
    >;
  };
};

function isPrivatePhotoHref(href: string): boolean {
  return /^\/api\/reports\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/photo$/i.test(
    href,
  );
}

function formatAccuracy(accuracyMeters: number | null): string {
  if (accuracyMeters === null) return "Belum tersedia";

  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(accuracyMeters)} m`;
}

export function LedgerPhotoViewer({
  capturedAtLabel,
  row,
}: LedgerPhotoViewerProps) {
  const { closeDialog, dialogRef, onKeyDown, open, openDialog, triggerRef } =
    useLedgerDialog();
  const shortId = row.reportId.slice(0, 8);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;

  if (!row.hasPhoto || !row.photoHref || !isPrivatePhotoHref(row.photoHref)) {
    return (
      <span className="text-xs text-muted-foreground">Foto belum tersedia</span>
    );
  }

  return (
    <>
      <button
        aria-controls={open ? dialogId : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Lihat foto bukti laporan ${shortId}`}
        className="group inline-flex flex-col items-start gap-1 rounded-lg text-xs font-semibold text-peat-green underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
        onClick={openDialog}
        ref={triggerRef}
        type="button"
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
      </button>

      <LedgerDialog
        describedBy={descriptionId}
        dialogRef={dialogRef}
        id={dialogId}
        onClose={closeDialog}
        onKeyDown={onKeyDown}
        open={open}
        titleId={titleId}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="font-heading text-2xl font-bold text-peat-forest"
              id={titleId}
            >
              Foto bukti laporan {shortId}
            </h2>
            <p
              className="mt-2 text-sm leading-6 text-muted-foreground"
              id={descriptionId}
            >
              Bukti diambil {capturedAtLabel} ·{" "}
              {row.villageName ?? "Desa tidak diketahui"}
            </p>
          </div>
          <button
            aria-label="Tutup foto bukti"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            data-autofocus
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </header>

        <div className="mt-5 overflow-hidden rounded-xl bg-peat-forest p-2">
          <Image
            alt={`Foto bukti laporan ${shortId}`}
            className="mx-auto max-h-[60vh] w-auto max-w-full rounded-lg object-contain"
            height={1200}
            src={row.photoHref}
            unoptimized
            width={1600}
          />
        </div>

        <dl className="mt-4 grid gap-3 rounded-xl bg-peat-paper/70 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              Waktu rekam
            </dt>
            <dd className="mt-1 font-medium text-peat-forest">
              <time dateTime={row.capturedAt}>{capturedAtLabel}</time>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              Akurasi yang dilaporkan perangkat
            </dt>
            <dd className="mt-1 font-medium text-peat-forest">
              {formatAccuracy(row.coordinates.accuracyMeters)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-muted-foreground">
              Koordinat tersimpan
            </dt>
            <dd className="mt-1 font-mono text-peat-forest">
              {row.coordinates.latitude.toFixed(4)},{" "}
              {row.coordinates.longitude.toFixed(4)}
            </dd>
            <p className="mt-1 text-xs leading-5 text-warning">
              Tercatat, belum diverifikasi secara independen.
            </p>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground">
              Kelengkapan bukti
            </dt>
            <dd className="mt-1 font-medium text-peat-forest">
              {row.evidenceStatus === "complete" ? "Lengkap" : "Belum lengkap"}
              {" · bukan verifikasi lokasi"}
            </dd>
          </div>
        </dl>
      </LedgerDialog>
    </>
  );
}
