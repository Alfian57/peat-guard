import "server-only";

import { createHash } from "node:crypto";

import { getLatestEvidenceVersion } from "./follow-up";
import { prisma } from "@/lib/prisma";
import { assertRoleAccess } from "@/lib/role-access";
import type {
  EvidenceReviewDecision,
  MrvEvidenceSnapshot,
  MrvLedgerAuditEntry,
} from "@/lib/server/mrv/contracts";
import type { ReportActor } from "@/lib/server/reports/access";
import { readPrivateReportPhoto } from "@/lib/server/uploads/private-photo";

export class MrvEvidenceReviewError extends Error {
  constructor(
    readonly status: 404 | 409 | 422,
    message: string,
  ) {
    super(message);
    this.name = "MrvEvidenceReviewError";
  }
}

export async function recordMrvEvidenceReview(
  actor: ReportActor,
  reportId: string,
  decision: EvidenceReviewDecision,
  options?: { note?: string; expectedVersion?: string | null },
): Promise<MrvLedgerAuditEntry> {
  assertRoleAccess(true, actor.role, ["VERIFIKATOR"]);

  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT id FROM field_reports WHERE id = ${reportId}::uuid FOR UPDATE`;
    const version = await getLatestEvidenceVersion(transaction, reportId);
    if ((options?.expectedVersion ?? null) !== (version?.id ?? null))
      throw new MrvEvidenceReviewError(
        409,
        "Bukti sudah berubah. Muat ulang sebelum menyimpan keputusan.",
      );
    if (decision === "NEEDS_FOLLOW_UP" && !options?.note?.trim())
      throw new MrvEvidenceReviewError(
        422,
        "Catatan tindak lanjut wajib diisi.",
      );
    const report = await transaction.fieldReport.findUnique({
      where: { id: reportId },
      select: {
        accuracyMeters: true,
        aiCategory: true,
        aiConfidence: true,
        aiState: true,
        aiUrgency: true,
        capturedAt: true,
        id: true,
        imagePath: true,
        latitude: true,
        longitude: true,
        syncedAt: true,
      },
    });

    if (!report) {
      throw new MrvEvidenceReviewError(404, "Laporan tidak ditemukan.");
    }

    const [supplement] = await transaction.$queryRaw<
      Array<{ id: string; path: string }>
    >`
      SELECT id, payload->>'imagePath' AS path FROM audit_events
      WHERE report_id = ${reportId}::uuid AND event_type = 'MRV_EVIDENCE_SUPPLEMENTED' AND payload->>'imagePath' IS NOT NULL
      ORDER BY created_at DESC, id DESC LIMIT 1
    `;
    const supplementalPath = supplement?.path;
    const addedPhoto = supplementalPath
      ? await readPrivateReportPhoto(supplementalPath)
      : null;
    const photoBytes =
      addedPhoto ??
      (report.imagePath
        ? await readPrivateReportPhoto(report.imagePath)
        : null);
    const photoSha256 = photoBytes
      ? createHash("sha256").update(photoBytes).digest("hex")
      : null;
    const evidenceSnapshot: MrvEvidenceSnapshot = {
      accuracyMeters:
        report.accuracyMeters !== null &&
        Number.isFinite(report.accuracyMeters) &&
        report.accuracyMeters >= 0
          ? report.accuracyMeters
          : null,
      aiCategory: report.aiCategory,
      aiConfidence:
        report.aiConfidence === null ? null : Number(report.aiConfidence),
      aiState: report.aiState,
      aiUrgency: report.aiUrgency,
      capturedAt: report.capturedAt.toISOString(),
      latitude: report.latitude,
      longitude: report.longitude,
      photoPresent: photoBytes !== null,
      photoSha256,
      syncedAt: report.syncedAt.toISOString(),
    };

    if (
      decision === "ACCEPTED" &&
      (!Number.isFinite(evidenceSnapshot.latitude) ||
        evidenceSnapshot.latitude < -90 ||
        evidenceSnapshot.latitude > 90 ||
        !Number.isFinite(evidenceSnapshot.longitude) ||
        evidenceSnapshot.longitude < -180 ||
        evidenceSnapshot.longitude > 180 ||
        !evidenceSnapshot.photoPresent)
    ) {
      throw new MrvEvidenceReviewError(
        422,
        "Bukti koordinat dan foto tersimpan diperlukan untuk menerima bukti.",
      );
    }

    const auditEvent = await transaction.auditEvent.create({
      data: {
        reportId,
        actorId: actor.id,
        aggregateType: "FieldReport",
        aggregateId: reportId,
        eventType: "MRV_EVIDENCE_REVIEWED",
        payload: {
          actorRole: actor.role,
          decision,
          ...(options?.note ? { note: options.note } : {}),
          ...(addedPhoto && supplement
            ? { supplementalEvidenceId: supplement.id }
            : {}),
          evidenceSnapshot,
        },
      },
      select: { id: true, createdAt: true },
    });

    return {
      actorRole: actor.role,
      classification: null,
      createdAt: auditEvent.createdAt.toISOString(),
      decision,
      ...(options?.note ? { note: options.note } : {}),
      eventId: auditEvent.id,
      eventType: "MRV_EVIDENCE_REVIEWED",
      evidenceSnapshot,
      source: null,
    };
  });
}
