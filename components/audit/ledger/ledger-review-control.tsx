"use client";

import { useState } from "react";

import type {
  EvidenceReviewDecision,
  MrvLedgerAuditEntry,
} from "@/lib/server/mrv/contracts";
import { parseMrvLedgerAuditEntry } from "@/lib/mrv/audit-history";

import { formatDateTime, formatDecimal } from "../audit-formatters";

const decisionLabels: Record<EvidenceReviewDecision, string> = {
  ACCEPTED: "Bukti diterima",
  NEEDS_FOLLOW_UP: "Perlu tindak lanjut",
  REJECTED: "Bukti tidak diterima",
};

const aiStateLabels: Record<string, string> = {
  COMPLETED: "Selesai",
  FAILED: "Gagal",
  PENDING: "Menunggu",
  SKIPPED: "Tidak dianalisis",
};

function eventTitle(event: MrvLedgerAuditEntry): string {
  if (event.eventType === "REPORT_EVIDENCE_RECORDED") {
    return "Bukti awal dicatat";
  }
  if (event.eventType === "REPORT_AI_ANALYSIS_COMPLETED") {
    return "Hasil triase AI dicatat";
  }
  if (event.eventType === "REPORT_AI_ANALYSIS_FAILED") {
    return "Kegagalan triase AI dicatat";
  }
  return `Keputusan peninjauan: ${event.decision ? decisionLabels[event.decision].toLowerCase() : "tidak tersedia"}`;
}

function EvidenceSnapshotDetails({ event }: { event: MrvLedgerAuditEntry }) {
  const snapshot = event.evidenceSnapshot;

  if (!snapshot) return null;

  return (
    <dl className="mt-2 grid gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
      <dt className="text-muted-foreground">Koordinat tersimpan</dt>
      <dd className="font-mono text-peat-forest">
        {snapshot.latitude.toFixed(4)}, {snapshot.longitude.toFixed(4)}
      </dd>
      <dt className="text-muted-foreground">Akurasi perangkat</dt>
      <dd className="text-peat-forest">
        {snapshot.accuracyMeters === null
          ? "Belum tersedia"
          : `${formatDecimal(snapshot.accuracyMeters)} m`}
      </dd>
      <dt className="text-muted-foreground">Foto</dt>
      <dd className="text-peat-forest">
        {snapshot.photoPresent ? "Tersimpan" : "Tidak tersedia"}
        {snapshot.photoSha256 ? (
          <span className="mt-0.5 block font-mono text-[0.65rem] break-all text-muted-foreground">
            SHA-256 {snapshot.photoSha256}
          </span>
        ) : null}
      </dd>
      <dt className="text-muted-foreground">Triase saat dicatat</dt>
      <dd className="text-peat-forest">
        {aiStateLabels[snapshot.aiState ?? ""] ?? "Belum tersedia"}
        {snapshot.aiCategory ? ` · ${snapshot.aiCategory}` : ""}
        {snapshot.aiUrgency ? ` · ${snapshot.aiUrgency}` : ""}
      </dd>
      <dt className="text-muted-foreground">Waktu lapangan / sinkronisasi</dt>
      <dd className="text-peat-forest">
        {formatDateTime(snapshot.capturedAt)} /{" "}
        {formatDateTime(snapshot.syncedAt)}
      </dd>
    </dl>
  );
}

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
  const [history, setHistory] = useState(auditHistory);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
    hasPhoto &&
    photoHref !== null;

  async function submitDecision(decision: EvidenceReviewDecision) {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/command/mrv/ledger/${reportId}/review`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
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
      setMessage(`Keputusan tercatat: ${decisionLabels[decision]}.`);
    } catch {
      setError("Peninjauan bukti belum dapat disimpan. Periksa koneksi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="mt-3 max-w-80 rounded-lg border border-border bg-white px-2.5 py-2 text-xs">
      <summary className="min-h-8 cursor-pointer font-semibold text-peat-green">
        Peninjauan bukti
        {latestReview?.decision
          ? ` · ${decisionLabels[latestReview.decision]}`
          : " · belum ditinjau"}
      </summary>
      <p className="mt-2 leading-5 text-muted-foreground">
        Keputusan ini menilai bukti yang tersimpan. Koordinat dan akurasi
        berasal dari perangkat dan tidak diverifikasi secara independen.
      </p>
      <ol className="mt-3 space-y-3 border-l border-peat-green/20 pl-3">
        {history.length > 0 ? (
          history.map((event) => (
            <li key={event.eventId}>
              <p className="font-semibold text-peat-forest">
                {eventTitle(event)}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {formatDateTime(event.createdAt)}
                {event.actorRole ? ` · ${event.actorRole}` : ""}
              </p>
              {event.classification ? (
                <p className="mt-1 text-peat-forest">
                  {aiStateLabels[event.classification.state] ??
                    event.classification.state}
                  {event.classification.category
                    ? ` · ${event.classification.category}`
                    : ""}
                  {event.classification.urgency
                    ? ` · ${event.classification.urgency}`
                    : ""}
                  {event.classification.confidence !== null
                    ? ` · ${formatDecimal(event.classification.confidence * 100)}%`
                    : ""}
                </p>
              ) : null}
              <EvidenceSnapshotDetails event={event} />
            </li>
          ))
        ) : (
          <li className="text-muted-foreground">
            Snapshot audit awal belum tersedia untuk laporan ini.
          </li>
        )}
      </ol>
      <p className="mt-3 rounded-lg bg-peat-paper px-3 py-2 leading-5 text-foreground">
        Untuk menerima bukti diperlukan koordinat dalam batas dan foto yang
        tersimpan. Triase AI dapat berstatus tidak dianalisis.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="min-h-9 rounded-lg bg-peat-green px-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canAccept || pending}
          onClick={() => void submitDecision("ACCEPTED")}
          type="button"
        >
          Terima bukti {reportId.slice(0, 8)}
        </button>
        <button
          className="min-h-9 rounded-lg border border-border px-3 font-semibold text-peat-forest disabled:opacity-50"
          disabled={pending}
          onClick={() => void submitDecision("NEEDS_FOLLOW_UP")}
          type="button"
        >
          Minta tindak lanjut {reportId.slice(0, 8)}
        </button>
        <button
          className="min-h-9 rounded-lg border border-warning/30 px-3 font-semibold text-warning disabled:opacity-50"
          disabled={pending}
          onClick={() => void submitDecision("REJECTED")}
          type="button"
        >
          Tolak bukti {reportId.slice(0, 8)}
        </button>
      </div>
      {pending ? (
        <p className="mt-2 text-muted-foreground" role="status">
          Mencatat keputusan peninjauan…
        </p>
      ) : null}
      {message ? (
        <p className="mt-2 font-semibold text-peat-green" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 font-semibold text-warning" role="alert">
          {error}
        </p>
      ) : null}
    </details>
  );
}
