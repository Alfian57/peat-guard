"use client";

import { ClipboardCheck, LoaderCircle, X } from "lucide-react";
import { useId, useState } from "react";

import type {
  EvidenceReviewDecision,
  MrvLedgerAuditEntry,
} from "@/lib/server/mrv/contracts";
import { parseMrvLedgerAuditEntry } from "@/lib/mrv/audit-history";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { API_ROUTES } from "@/lib/routes";

import { LedgerAuditTimeline } from "./ledger-audit-timeline";
import { LedgerDialog, useLedgerDialog } from "./ledger-dialog";

const decisionLabels: Record<EvidenceReviewDecision, string> = {
  ACCEPTED: "Bukti diterima",
  NEEDS_FOLLOW_UP: "Perlu tindak lanjut",
  REJECTED: "Bukti tidak diterima",
};

const decisionStatusClasses: Record<EvidenceReviewDecision, string> = {
  ACCEPTED: "border-safe/15 bg-safe/5 text-safe",
  NEEDS_FOLLOW_UP: "border-warning/20 bg-warning/5 text-warning",
  REJECTED: "border-critical/20 bg-critical/5 text-critical",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readReview(value: unknown): MrvLedgerAuditEntry | null {
  if (!isRecord(value) || !isRecord(value.review)) return null;

  const review = value.review;
  return parseMrvLedgerAuditEntry({
    actor: { role: review.actorRole },
    createdAt: review.createdAt,
    eventType: review.eventType,
    id: review.eventId,
    payload: {
      actorRole: review.actorRole,
      note: review.note,
      decision: review.decision,
      evidenceSnapshot: review.evidenceSnapshot,
      source: review.source,
    },
  });
}

function readError(value: unknown): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : "Keputusan peninjauan belum dapat disimpan.";
}

export function LedgerReviewControl({
  auditHistory,
  coordinates,
  hasPhoto,
  photoHref,
  reportId,
}: {
  auditHistory: MrvLedgerAuditEntry[];
  coordinates: {
    accuracyMeters: number | null;
    latitude: number;
    longitude: number;
  };
  hasPhoto: boolean;
  photoHref: string | null;
  reportId: string;
}) {
  const { closeDialog, dialogRef, onKeyDown, open, openDialog, triggerRef } =
    useLedgerDialog();
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const shortId = reportId.slice(0, 8);
  const [history, setHistory] = useState(auditHistory);
  const [pendingDecision, setPendingDecision] =
    useState<EvidenceReviewDecision | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const latestVersion = [...history]
    .reverse()
    .find(
      (item) =>
        item.eventType === "MRV_EVIDENCE_REVIEWED" ||
        item.eventType === "MRV_EVIDENCE_SUPPLEMENTED",
    );
  const hasSupplementPhoto = history.some((item) => item.hasSupplementPhoto);
  const latestReview = [...history]
    .reverse()
    .find((event) => event.eventType === "MRV_EVIDENCE_REVIEWED");
  const canAccept =
    Number.isFinite(coordinates.latitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180 &&
    ((hasPhoto && photoHref !== null) || hasSupplementPhoto);

  async function submitDecision(decision: EvidenceReviewDecision) {
    if (pendingDecision || (decision === "NEEDS_FOLLOW_UP" && !note.trim()))
      return;

    setPendingDecision(decision);
    setError(null);

    try {
      const response = await fetch(
        API_ROUTES.command.mrvLedgerReview(reportId),
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            expectedVersion: latestVersion?.eventId ?? null,
            ...(note.trim() ? { note: note.trim() } : {}),
          }),
        },
      );
      const payload: unknown = await response.json();

      if (!response.ok) {
        setError(readError(payload));
        return;
      }

      const review = readReview(payload);
      if (!review || review.eventType !== "MRV_EVIDENCE_REVIEWED") {
        setError("Respons peninjauan tidak dapat dibaca.");
        return;
      }

      setHistory((current) => [...current, review]);
      setNote("");
      toast.success(
        "Keputusan peninjauan tersimpan",
        `${decisionLabels[decision]} · Laporan ${shortId}`,
      );
      closeDialog();
    } catch {
      setError("Peninjauan bukti belum dapat disimpan. Periksa koneksi.");
    } finally {
      setPendingDecision(null);
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              aria-controls={open ? dialogId : undefined}
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label={`Peninjauan bukti laporan ${shortId}`}
              className="inline-grid size-9 shrink-0 place-items-center rounded-full border border-border bg-white text-peat-green shadow-xs transition-colors hover:border-peat-forest/25 hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onClick={openDialog}
              ref={triggerRef}
              type="button"
            >
              <ClipboardCheck aria-hidden="true" size={16} />
            </button>
          }
        />
        <TooltipContent>Peninjauan bukti</TooltipContent>
      </Tooltip>
      <p
        className={`col-span-2 max-w-full rounded-full border px-2 py-1 text-center text-[11px] leading-4 font-medium ${latestReview?.decision ? decisionStatusClasses[latestReview.decision] : "border-peat-forest/10 bg-white text-muted-foreground"}`}
      >
        {latestReview?.decision
          ? decisionLabels[latestReview.decision]
          : "Belum ditinjau"}
      </p>
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
              Peninjauan bukti
            </h2>
            <p
              className="mt-2 text-sm text-muted-foreground"
              id={descriptionId}
            >
              Bukti dan keputusan peninjauan laporan {shortId}.
            </p>
          </div>
          <button
            aria-label="Tutup peninjauan bukti"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            data-autofocus
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </header>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Keputusan ini menilai bukti yang tersimpan. Koordinat dan akurasi
          berasal dari perangkat dan tidak diverifikasi secara independen.
        </p>
        <LedgerAuditTimeline history={history} reportId={reportId} />
        <label className="mt-4 block text-sm font-medium">
          Catatan peninjauan (wajib untuk tindak lanjut)
          <textarea
            className="mt-1 block w-full rounded-xl border p-2"
            value={note}
            rows={2}
            maxLength={500}
            onChange={(event) => setNote(event.currentTarget.value)}
          />
        </label>
        <p className="mt-5 rounded-xl border border-peat-forest/15 bg-white p-4 text-sm leading-6 text-foreground">
          Untuk menerima bukti diperlukan koordinat dalam batas dan foto yang
          tersimpan. Triase AI dapat berstatus tidak dianalisis.
        </p>
        {error ? (
          <p
            className="mt-4 rounded-xl bg-warning/10 p-3 text-sm text-warning"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div
          aria-busy={pendingDecision !== null}
          className="mt-5 flex flex-wrap justify-end gap-2 border-t border-peat-forest/10 pt-4 text-sm"
        >
          <span className="sr-only" role="status">
            {pendingDecision
              ? `Menyimpan keputusan: ${decisionLabels[pendingDecision]}.`
              : ""}
          </span>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-peat-green px-4 font-semibold text-white hover:bg-peat-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canAccept || pendingDecision !== null}
            onClick={() => void submitDecision("ACCEPTED")}
            type="button"
          >
            {pendingDecision === "ACCEPTED" ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={16}
              />
            ) : null}
            {pendingDecision === "ACCEPTED" ? (
              <span className="sr-only">Menyimpan keputusan</span>
            ) : null}
            <span aria-hidden={pendingDecision === "ACCEPTED" || undefined}>
              Terima bukti
            </span>
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-peat-forest/10 px-4 font-semibold text-peat-forest hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
            disabled={pendingDecision !== null || !note.trim()}
            onClick={() => void submitDecision("NEEDS_FOLLOW_UP")}
            type="button"
          >
            {pendingDecision === "NEEDS_FOLLOW_UP" ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={16}
              />
            ) : null}
            {pendingDecision === "NEEDS_FOLLOW_UP" ? (
              <span className="sr-only">Menyimpan keputusan</span>
            ) : null}
            <span
              aria-hidden={pendingDecision === "NEEDS_FOLLOW_UP" || undefined}
            >
              Minta tindak lanjut
            </span>
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-warning/30 px-4 font-semibold text-warning hover:bg-warning/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
            disabled={pendingDecision !== null}
            onClick={() => void submitDecision("REJECTED")}
            type="button"
          >
            {pendingDecision === "REJECTED" ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={16}
              />
            ) : null}
            {pendingDecision === "REJECTED" ? (
              <span className="sr-only">Menyimpan keputusan</span>
            ) : null}
            <span aria-hidden={pendingDecision === "REJECTED" || undefined}>
              Tolak bukti
            </span>
          </button>
        </div>
      </LedgerDialog>
    </>
  );
}
