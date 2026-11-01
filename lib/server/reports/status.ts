import "server-only";

import type { HandlingStatus as HandlingStatusValue } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  assertCanChangeReportStatus,
  type ReportActor,
} from "@/lib/server/reports/access";
import {
  ReportNotFoundError,
  ReportStateConflictError,
} from "@/lib/server/reports/http";
import type { ReportStatusUpdate } from "@/lib/server/reports/status-input";

type StatusTransactionResult =
  | { updated: true; status: HandlingStatusValue }
  | { updated: false; status: HandlingStatusValue };

export async function updateReportStatus(
  actor: ReportActor,
  reportId: string,
  input: ReportStatusUpdate,
): Promise<{ id: string; status: HandlingStatusValue }> {
  assertCanChangeReportStatus(actor);

  const result = await prisma.$transaction(
    async (transaction): Promise<StatusTransactionResult> => {
      const current = await transaction.fieldReport.findUnique({
        where: { id: reportId },
        select: { handlingStatus: true },
      });
      if (!current) throw new ReportNotFoundError();

      const updated = await transaction.fieldReport.updateMany({
        where: {
          id: reportId,
          handlingStatus: input.expectedStatus,
        },
        data: {
          handlingStatus: input.nextStatus,
          updatedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        const latest = await transaction.fieldReport.findUnique({
          where: { id: reportId },
          select: { handlingStatus: true },
        });
        if (!latest) throw new ReportNotFoundError();
        return { updated: false, status: latest.handlingStatus };
      }

      await transaction.reportStatusEvent.create({
        data: {
          reportId,
          changedById: actor.id,
          previousStatus: input.expectedStatus,
          nextStatus: input.nextStatus,
          note: input.note,
        },
      });
      await transaction.auditEvent.create({
        data: {
          reportId,
          actorId: actor.id,
          aggregateType: "FieldReport",
          aggregateId: reportId,
          eventType: "REPORT_STATUS_CHANGED",
          payload: {
            previousStatus: input.expectedStatus,
            nextStatus: input.nextStatus,
          },
        },
      });

      return { updated: true, status: input.nextStatus };
    },
  );

  if (!result.updated) throw new ReportStateConflictError(result.status);
  return { id: reportId, status: result.status };
}
