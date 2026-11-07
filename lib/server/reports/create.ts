import "server-only";

import { randomUUID } from "node:crypto";

import {
  AIAnalysisState,
  HandlingStatus,
  Prisma,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeNormalizedReportPhoto } from "@/lib/server/ai/deepseek";
import {
  assertCanCreateReport,
  isLocalDemoVolunteer,
  type ReportActor,
} from "@/lib/server/reports/access";
import {
  parseClientReportId,
  parseReportFormData,
} from "@/lib/server/reports/input";
import {
  normalizeReportPhoto,
  removePrivateReportPhoto,
  savePrivateReportPhoto,
} from "@/lib/server/uploads/private-photo";
import { AuthorizationError } from "@/lib/role-access";

type CreateReportResult =
  | { created: false; id: string }
  | {
      created: true;
      id: string;
      aiConsent: boolean;
      normalizedPhoto: Buffer;
    };

type SpatialContext = {
  zoneId: string | null;
  nearestWaterDistanceMeters: number | null;
};

async function deriveSpatialContext(
  transaction: Prisma.TransactionClient,
  latitude: number,
  longitude: number,
): Promise<SpatialContext> {
  const [zones, waterPoints] = await Promise.all([
    transaction.$queryRaw<Array<{ id: string }>>`
      SELECT zone."id"::text AS "id"
      FROM "forest_zones" AS zone
      WHERE zone."is_approved" = true
        AND ST_Covers(
          zone."boundary",
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        )
      ORDER BY zone."id"
      LIMIT 1
    `,
    transaction.$queryRaw<Array<{ distanceMeters: number }>>`
      WITH origin AS (
        SELECT ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326) AS location
      ),
      nearest_seed AS (
        SELECT
          ST_Distance(point."location"::geography, origin.location::geography)
            AS "distanceMeters"
        FROM "water_points" AS point
        CROSS JOIN origin
        ORDER BY point."location" <-> ST_SetSRID(
          ST_MakePoint(${longitude}, ${latitude}),
          4326
        )
        LIMIT 1
      ),
      search_area AS (
        SELECT ST_Envelope(
          ST_Buffer(
            origin.location::geography,
            nearest_seed."distanceMeters" * 1.01 + 1,
            32
          )::geometry
        ) AS bounds
        FROM origin
        CROSS JOIN nearest_seed
      )
      SELECT ST_Distance(
        point."location"::geography,
        origin.location::geography
      ) AS "distanceMeters"
      FROM "water_points" AS point
      CROSS JOIN origin
      CROSS JOIN search_area
      WHERE point."location" && search_area.bounds
      ORDER BY ST_Distance(
        point."location"::geography,
        origin.location::geography
      )
      LIMIT 1
    `,
  ]);

  const distanceMeters = waterPoints[0]?.distanceMeters;

  return {
    zoneId: zones[0]?.id ?? null,
    nearestWaterDistanceMeters:
      typeof distanceMeters === "number" && Number.isFinite(distanceMeters)
        ? distanceMeters
        : null,
  };
}

async function persistAiAssessment(
  reportId: string,
  assessment: Awaited<ReturnType<typeof analyzeNormalizedReportPhoto>>,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await transaction.fieldReport.update({
      where: { id: reportId },
      data: {
        aiState: AIAnalysisState.COMPLETED,
        aiCategory: assessment.category,
        aiUrgency: assessment.urgency,
        aiConfidence: assessment.confidence.toFixed(3),
        aiSummary: assessment.summary,
        aiVisualIndicators: assessment.visualIndicators,
        aiFalsePositiveCheck: assessment.falsePositiveCheck,
        aiActionRecommendations: assessment.actionRecommendations,
        aiAnalyzedAt: new Date(),
      },
    });
    await transaction.auditEvent.create({
      data: {
        reportId,
        actorId: null,
        aggregateType: "FieldReport",
        aggregateId: reportId,
        eventType: "REPORT_AI_ANALYSIS_COMPLETED",
        payload: { provider: "deepseek", state: "COMPLETED" },
      },
    });
  });
}

async function persistAiFailure(reportId: string): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await transaction.fieldReport.update({
      where: { id: reportId },
      data: {
        aiState: AIAnalysisState.FAILED,
        aiAnalyzedAt: new Date(),
      },
    });
    await transaction.auditEvent.create({
      data: {
        reportId,
        actorId: null,
        aggregateType: "FieldReport",
        aggregateId: reportId,
        eventType: "REPORT_AI_ANALYSIS_FAILED",
        payload: { provider: "deepseek", state: "FAILED" },
      },
    });
  });
}

async function runConsentAnalysis(
  reportId: string,
  normalizedPhoto: Buffer,
): Promise<void> {
  try {
    const assessment = await analyzeNormalizedReportPhoto(normalizedPhoto);
    await persistAiAssessment(reportId, assessment);
  } catch {
    try {
      await persistAiFailure(reportId);
    } catch {
      // The report is already committed. If analysis state cannot be persisted,
      // leave it PENDING so a later operational check can identify it.
    }
  }
}

export async function createFieldReport(
  actor: ReportActor,
  formData: FormData,
): Promise<{ id: string; created: boolean }> {
  assertCanCreateReport(actor);
  const clientReportId = parseClientReportId(formData);
  const idempotencyKey = `${actor.id.toLowerCase()}:${clientReportId}`;
  let savedPhotoName: string | undefined;
  let result: CreateReportResult;

  try {
    result = await prisma.$transaction(
      async (transaction) => {
        await transaction.$queryRaw<Array<{ locked: number }>>`
          WITH lock AS MATERIALIZED (
            SELECT pg_advisory_xact_lock(hashtextextended(${idempotencyKey}, 0))
          )
          SELECT 1 AS "locked" FROM lock
        `;

        const existingReport = await transaction.fieldReport.findUnique({
          where: {
            reporterId_clientReportId: {
              reporterId: actor.id,
              clientReportId,
            },
          },
          select: { id: true },
        });
        if (existingReport) return { created: false, id: existingReport.id };

        const input = parseReportFormData(formData);
        if (input.isDemoSample && !isLocalDemoVolunteer(actor)) {
          throw new AuthorizationError(403);
        }

        const normalized = await normalizeReportPhoto(input.photo);
        const spatial = await deriveSpatialContext(
          transaction,
          input.latitude,
          input.longitude,
        );
        const reportId = randomUUID();
        savedPhotoName = await savePrivateReportPhoto(normalized.bytes);
        const tagsSql = input.tags.length
          ? Prisma.sql`ARRAY[${Prisma.join(input.tags)}]::varchar(60)[]`
          : Prisma.sql`ARRAY[]::varchar(60)[]`;

        await transaction.$executeRaw`
          INSERT INTO "field_reports" (
            "id", "client_report_id", "reporter_id", "zone_id", "latitude",
            "longitude", "accuracy_meters", "location", "image_path", "field_notes",
            "tags", "captured_at", "synced_at", "ai_consent", "ai_state",
            "handling_status", "nearest_water_distance_m", "is_demo_sample",
            "created_at", "updated_at"
          ) VALUES (
            ${reportId}::uuid,
            ${input.clientReportId}::uuid,
            ${actor.id}::uuid,
            ${spatial.zoneId}::uuid,
            ${input.latitude},
            ${input.longitude},
            ${input.accuracyMeters}::double precision,
            ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326),
            ${savedPhotoName},
            ${input.fieldNotes},
            ${tagsSql},
            ${input.capturedAt},
            CURRENT_TIMESTAMP,
            ${input.aiConsent},
            ${input.aiConsent ? AIAnalysisState.PENDING : AIAnalysisState.SKIPPED}::"AIAnalysisState",
            ${HandlingStatus.MENUNGGU_TINDAKAN}::"HandlingStatus",
            ${spatial.nearestWaterDistanceMeters}::numeric,
            ${input.isDemoSample},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `;

        await transaction.reportStatusEvent.create({
          data: {
            reportId,
            changedById: actor.id,
            previousStatus: null,
            nextStatus: HandlingStatus.MENUNGGU_TINDAKAN,
          },
        });
        await transaction.auditEvent.create({
          data: {
            reportId,
            actorId: actor.id,
            aggregateType: "FieldReport",
            aggregateId: reportId,
            eventType: "REPORT_CREATED",
            payload: {
              source: "field_sync",
              aiConsent: input.aiConsent,
              isDemoSample: input.isDemoSample,
            },
          },
        });

        return {
          created: true,
          id: reportId,
          aiConsent: input.aiConsent,
          normalizedPhoto: normalized.bytes,
        };
      },
      { maxWait: 5_000, timeout: 30_000 },
    );
  } catch (error) {
    if (savedPhotoName) {
      try {
        await removePrivateReportPhoto(savedPhotoName);
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          "Report persistence failed and its private photo could not be removed.",
        );
      }
    }

    throw error;
  }

  if (result.created && result.aiConsent) {
    await runConsentAnalysis(result.id, result.normalizedPhoto);
  }

  return { id: result.id, created: result.created };
}
