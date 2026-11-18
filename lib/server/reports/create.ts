import "server-only";

import { randomUUID } from "node:crypto";

import {
  AIAnalysisState,
  HandlingStatus,
  Prisma,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertCanCreateReport,
  isLocalDemoVolunteer,
  type ReportActor,
} from "@/lib/server/reports/access";
import {
  parseClientReportId,
  ReportDemoSampleError,
  parseReportFormData,
} from "@/lib/server/reports/input";
import {
  normalizeReportPhoto,
  removePrivateReportPhoto,
  savePrivateReportPhoto,
} from "@/lib/server/uploads/private-photo";

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
        AND zone."archived_at" IS NULL
        AND ST_Covers(
          zone."boundary",
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        )
      ORDER BY zone."id"
      LIMIT 1
      FOR SHARE OF zone
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

export async function createFieldReport(
  actor: ReportActor,
  formData: FormData,
): Promise<{ id: string; created: boolean }> {
  assertCanCreateReport(actor);
  const clientReportId = parseClientReportId(formData);
  const idempotencyKey = `${actor.id.toLowerCase()}:${clientReportId}`;
  let savedPhotoName: string | undefined;
  let result: { id: string; created: boolean };

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
          throw new ReportDemoSampleError();
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
            "created_at", "updated_at", "canal_condition", "canal_observation"
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
            CURRENT_TIMESTAMP,
            ${input.canalCondition ?? null}::"CanalCondition",
            ${input.canalObservation ?? null}
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

        return { created: true, id: reportId };
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

  return result;
}
