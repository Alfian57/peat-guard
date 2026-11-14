import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeNormalizedReportPhoto } from "@/lib/server/ai/deepseek";
import { readPrivateReportPhoto } from "@/lib/server/uploads/private-photo";

const MAX_ATTEMPTS = 3;
const LEASE_SECONDS = 60;

type AnalysisClaim = {
  id: string;
  imagePath: string;
  exhausted: boolean;
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
    RETURNING report.id, report.image_path AS "imagePath", candidate.exhausted
  `;
  return claim ? { ...claim, token } : null;
}

export async function processNextReportAnalysis(): Promise<void> {
  const claim = await claimReportAnalysis(prisma);
  if (!claim) return;

  let assessment: Assessment | null = null;
  if (!claim.exhausted) {
    try {
      const photo = await readPrivateReportPhoto(claim.imagePath);
      if (photo) assessment = await analyzeNormalizedReportPhoto(photo);
    } catch {
      // Provider and photo errors are terminal. A lost worker is retried by lease expiry.
    }
  }

  await prisma.$transaction((transaction) =>
    finishReportAnalysis(transaction, claim, assessment),
  );
}

export async function finishReportAnalysis(
  transaction: Prisma.TransactionClient,
  claim: AnalysisClaim,
  assessment: Assessment | null,
): Promise<void> {
  const state = assessment ? "COMPLETED" : "FAILED";
  const updated = await transaction.fieldReport.updateMany({
    where: {
      id: claim.id,
      aiConsent: true,
      aiState: "PENDING",
      aiLeaseToken: claim.token,
    },
    data: {
      aiState: state,
      aiAnalyzedAt: new Date(),
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
        : "REPORT_AI_ANALYSIS_FAILED",
      payload: { provider: "deepseek", state },
    },
  });
}
