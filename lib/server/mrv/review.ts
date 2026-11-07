import "server-only";

import { createHash } from "node:crypto";

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
    readonly status: 404 | 422,
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
): Promise<MrvLedgerAuditEntry> {
  assertRoleAccess(true, actor.role, ["VERIFIKATOR"]);

  return prisma.$transaction(async (transaction) => {
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

    const photoBytes = report.imagePath
      ? await readPrivateReportPhoto(report.imagePath)
      : null;
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
      eventId: auditEvent.id,
      eventType: "MRV_EVIDENCE_REVIEWED",
      evidenceSnapshot,
      source: null,
    };
  });
}
