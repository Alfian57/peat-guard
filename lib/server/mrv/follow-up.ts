import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { CommandApiError, isRecord } from "@/lib/server/command/http";
import type { ReportActor } from "@/lib/server/reports/access";
import { reportReadScope } from "@/lib/server/reports/access";
import {
  normalizeReportPhoto,
  removePrivateReportPhoto,
  savePrivateReportPhoto,
} from "@/lib/server/uploads/private-photo";

export const evidenceRevisionEvents = [
  "MRV_EVIDENCE_REVIEWED",
  "MRV_EVIDENCE_SUPPLEMENTED",
];

export function getLatestEvidenceVersion(
  transaction: Prisma.TransactionClient,
  reportId: string,
) {
  return transaction.auditEvent.findFirst({
    where: { reportId, eventType: { in: evidenceRevisionEvents } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, eventType: true, payload: true },
  });
}

export async function recordEvidenceSupplement(
  actor: ReportActor,
  reportId: string,
  reviewId: string,
  note: string,
  photo: File | null,
) {
  const ownerScope = { id: reportId, reporterId: actor.id };
  if (
    !(await prisma.fieldReport.findFirst({
      where: ownerScope,
      select: { id: true },
    }))
  ) {
    throw new CommandApiError(
      404,
      "report_not_found",
      "Laporan tidak ditemukan.",
    );
  }
  const normalized = photo ? await normalizeReportPhoto(photo) : null;
  let imagePath: string | null = null;
  try {
    return await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT id FROM field_reports WHERE id = ${reportId}::uuid FOR UPDATE`;
      const review = await getLatestEvidenceVersion(transaction, reportId);
      if (
        review?.id !== reviewId ||
        review.eventType !== "MRV_EVIDENCE_REVIEWED" ||
        !isRecord(review.payload) ||
        review.payload.decision !== "NEEDS_FOLLOW_UP"
      ) {
        throw new CommandApiError(
          409,
          "follow_up_conflict",
          "Permintaan ini sudah berubah. Muat ulang laporan.",
        );
      }
      imagePath = normalized
        ? await savePrivateReportPhoto(normalized.bytes)
        : null;
      return transaction.auditEvent.create({
        data: {
          reportId,
          actorId: actor.id,
          aggregateId: reportId,
          aggregateType: "FieldReport",
          eventType: "MRV_EVIDENCE_SUPPLEMENTED",
          payload: { note, imagePath, reviewId, actorRole: actor.role },
        },
        select: { id: true },
      });
    });
  } catch (error) {
    if (imagePath)
      await removePrivateReportPhoto(imagePath).catch(() => undefined);
    throw error;
  }
}

export async function getSupplementPhotoPath(
  actor: ReportActor,
  reportId: string,
  eventId: string,
) {
  const event = await prisma.auditEvent.findFirst({
    where: {
      id: eventId,
      reportId,
      eventType: "MRV_EVIDENCE_SUPPLEMENTED",
      report: { is: reportReadScope(actor) },
    },
    select: { payload: true },
  });
  return event &&
    isRecord(event.payload) &&
    typeof event.payload.imagePath === "string"
    ? event.payload.imagePath
    : null;
}
