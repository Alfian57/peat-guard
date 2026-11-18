import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CommandApiError } from "@/lib/server/command/http";
import {
  analyzeNormalizedReportPhoto,
  DeepSeekAnalysisError,
} from "@/lib/server/ai/deepseek";
import { readPrivateReportPhoto } from "@/lib/server/uploads/private-photo";

const MAX_ATTEMPTS = 3;
const LEASE_SECONDS = 60;

type AnalysisClaim = {
  id: string;
  imagePath: string;
  exhausted: boolean;
  attempts: number;
  token: string;
};
type Assessment = Awaited<ReturnType<typeof analyzeNormalizedReportPhoto>>;

export async function claimReportAnalysis(
  database: Prisma.TransactionClient,
): Promise<AnalysisClaim | null> {
  const token = randomUUID();
  const [claim] = await database.$queryRaw<Array<Omit<AnalysisClaim, "token">>>`
    WITH candidate AS (
      SELECT id, ai_attempts >= ${MAX_ATTEMPTS} AS exhausted FROM field_reports
      WHERE ai_state = 'PENDING' AND ai_consent
        AND (ai_retry_at IS NULL OR ai_retry_at <= clock_timestamp())
        AND (ai_lease_until IS NULL OR ai_lease_until <= clock_timestamp())
      ORDER BY created_at, id
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE field_reports AS report
    SET ai_attempts = LEAST(report.ai_attempts + 1, ${MAX_ATTEMPTS}),
      ai_lease_token = ${token}::uuid,
      ai_lease_until = clock_timestamp() + make_interval(secs => ${LEASE_SECONDS}::double precision)
    FROM candidate
    WHERE report.id = candidate.id
    RETURNING report.id, report.image_path AS "imagePath", candidate.exhausted, report.ai_attempts AS attempts
  `;
  return claim ? { ...claim, token } : null;
}

export async function processNextReportAnalysis(): Promise<void> {
  const claim = await claimReportAnalysis(prisma);
  if (!claim) return;

  let assessment: Assessment | null = null;
  let failureReason = claim.exhausted
    ? "attempts_exhausted"
    : "photo_unavailable";
  let retryAt: Date | null = null;
  if (!claim.exhausted) {
    try {
      const photo = await readPrivateReportPhoto(claim.imagePath);
      if (photo) assessment = await analyzeNormalizedReportPhoto(photo);
    } catch (error) {
      if (error instanceof DeepSeekAnalysisError) {
        failureReason = error.reason;
        if (error.retryDelayMs !== null && claim.attempts < MAX_ATTEMPTS) {
          const backoff = claim.attempts === 1 ? 60_000 : 300_000;
          retryAt = new Date(
            Date.now() + Math.max(backoff, error.retryDelayMs),
          );
        }
      }
    }
  }

  await prisma.$transaction((transaction) =>
    finishReportAnalysis(transaction, claim, assessment, {
      failureReason,
      retryAt,
    }),
  );
}

export async function requeueFailedReport(reportId: string, actorId: string) {
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.fieldReport.updateMany({
      where: { id: reportId, aiState: "FAILED", aiConsent: true },
      data: {
        aiState: "PENDING",
        aiAnalyzedAt: null,
        aiRetryAt: null,
        aiAttempts: 0,
        aiLeaseToken: null,
        aiLeaseUntil: null,
        aiFailureReason: null,
      },
    });
    if (!updated.count) {
      const report = await transaction.fieldReport.findUnique({
        where: { id: reportId },
        select: { aiState: true, aiConsent: true },
      });
      if (!report)
        throw new CommandApiError(
          404,
          "report_not_found",
          "Laporan tidak ditemukan.",
        );
      if (report.aiState === "PENDING" && report.aiConsent) return;
      throw new CommandApiError(
        409,
        "retry_not_available",
        "Analisis hanya dapat diulang untuk laporan gagal yang memiliki persetujuan AI.",
      );
    }
    await transaction.auditEvent.create({
      data: {
        actorId,
        reportId,
        aggregateId: reportId,
        aggregateType: "FieldReport",
        eventType: "REPORT_AI_REQUEUED",
      },
    });
  });
}

export async function finishReportAnalysis(
  transaction: Prisma.TransactionClient,
  claim: AnalysisClaim,
  assessment: Assessment | null,
  outcome?: { failureReason: string; retryAt: Date | null },
): Promise<void> {
  const state = assessment
    ? "COMPLETED"
    : outcome?.retryAt
      ? "PENDING"
      : "FAILED";
  const updated = await transaction.fieldReport.updateMany({
    where: {
      id: claim.id,
      aiConsent: true,
      aiState: "PENDING",
      aiLeaseToken: claim.token,
    },
    data: {
      aiState: state,
      aiAnalyzedAt: state === "PENDING" ? null : new Date(),
      aiRetryAt: outcome?.retryAt ?? null,
      aiFailureReason: assessment ? null : (outcome?.failureReason ?? null),
      aiLeaseToken: null,
      aiLeaseUntil: null,
      ...(assessment && {
        aiCategory: assessment.category,
        aiUrgency: assessment.urgency,
        aiConfidence: assessment.confidence.toFixed(3),
        aiSummary: assessment.summary,
        aiVisualIndicators: assessment.visualIndicators,
        aiFalsePositiveCheck: assessment.falsePositiveCheck,
        aiActionRecommendations: assessment.actionRecommendations,
      }),
    },
  });
  if (!updated.count) return;

  await transaction.auditEvent.create({
    data: {
      reportId: claim.id,
      aggregateType: "FieldReport",
      aggregateId: claim.id,
      eventType: assessment
        ? "REPORT_AI_ANALYSIS_COMPLETED"
        : state === "PENDING"
          ? "REPORT_AI_RETRY_SCHEDULED"
          : "REPORT_AI_ANALYSIS_FAILED",
      payload: {
        provider: "deepseek",
        state,
        reason: assessment ? null : (outcome?.failureReason ?? null),
        retryAt: outcome?.retryAt?.toISOString() ?? null,
      },
    },
  });
}
