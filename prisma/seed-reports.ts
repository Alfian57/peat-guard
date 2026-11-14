import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Prisma } from "../lib/generated/prisma/client";
import { DEMO_USERS } from "../lib/demo-login";
import {
  isPrivateReportPhotoFileName,
  normalizeReportPhoto,
  readPrivateReportPhoto,
  restorePrivateReportPhoto,
  savePrivateReportPhoto,
} from "../lib/server/uploads/private-photo";
import { demoReports, evidenceScenarios } from "./demo-data";

function dateAfter(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function reportIdFor(number: number): string {
  return `64${String(number).padStart(6, "0")}-0000-4000-8000-000000000001`;
}

async function normalizedDemoPhoto(
  sourceAsset: string,
  normalizedPhotos: Map<string, Buffer>,
): Promise<Buffer> {
  const cached = normalizedPhotos.get(sourceAsset);
  if (cached) return cached;

  const source = await readFile(
    join(process.cwd(), "prisma", "seed-assets", "report-photos", sourceAsset),
  );
  const photo = new File([new Uint8Array(source)], sourceAsset, {
    type: "image/webp",
  });
  const bytes = (await normalizeReportPhoto(photo)).bytes;
  normalizedPhotos.set(sourceAsset, bytes);
  return bytes;
}

export async function seedDemoReports(
  transaction: Prisma.TransactionClient,
  now: Date,
  savedPhotos: string[],
): Promise<{ inserted: number; restoredPhotos: number }> {
  const relawan = DEMO_USERS.find((user) => user.role === "RELAWAN");
  const posko = DEMO_USERS.find((user) => user.role === "POSKO");
  const verifikator = DEMO_USERS.find((user) => user.role === "VERIFIKATOR");
  if (!relawan || !posko || !verifikator) {
    throw new Error("Demo reports require a seeded account for each role.");
  }

  const existing = await transaction.fieldReport.findMany({
    where: {
      id: { in: demoReports.map((report) => reportIdFor(report.number)) },
    },
    select: { id: true, imagePath: true },
  });
  const existingById = new Map(
    existing.map((report) => [report.id, report] as const),
  );
  const normalizedPhotos = new Map<string, Buffer>();
  let inserted = 0;
  let restoredPhotos = 0;

  for (const fixture of demoReports) {
    const reportId = reportIdFor(fixture.number);
    const { latitude, longitude } = fixture;
    const scenario = evidenceScenarios[fixture.scenario];
    const existingReport = existingById.get(reportId);

    if (existingReport) {
      if (
        !fixture.noPhoto &&
        !(await readPrivateReportPhoto(existingReport.imagePath))
      ) {
        const assetIndex = (fixture.number - 1) % scenario.assets.length;
        const sourceAsset = scenario.assets[assetIndex];
        if (!sourceAsset) {
          throw new Error("Demo report scenario must define a source photo.");
        }

        const bytes = await normalizedDemoPhoto(sourceAsset, normalizedPhotos);
        if (isPrivateReportPhotoFileName(existingReport.imagePath)) {
          if (
            await restorePrivateReportPhoto(existingReport.imagePath, bytes)
          ) {
            restoredPhotos += 1;
          }
        } else {
          const replacementPath = await savePrivateReportPhoto(bytes);
          savedPhotos.push(replacementPath);
          await transaction.fieldReport.update({
            where: { id: reportId },
            data: { imagePath: replacementPath },
          });
        }
      }

      continue;
    }

    let imagePath = "";
    let photoSha256: string | null = null;
    if (!fixture.noPhoto) {
      const assetIndex = (fixture.number - 1) % scenario.assets.length;
      const sourceAsset = scenario.assets[assetIndex];
      if (!sourceAsset) {
        throw new Error("Demo report scenario must define a source photo.");
      }

      const bytes = await normalizedDemoPhoto(sourceAsset, normalizedPhotos);

      // Each demo report gets a fresh private filename, like an uploaded photo.
      imagePath = await savePrivateReportPhoto(bytes);
      savedPhotos.push(imagePath);
      photoSha256 = createHash("sha256").update(bytes).digest("hex");
    }

    const capturedAt = dateAfter(now, -fixture.hoursAgo * 60);
    const syncedAt = dateAfter(capturedAt, (fixture.number % 4) + 1);
    const accuracyMeters =
      fixture.accuracy === undefined
        ? 5 + ((fixture.number * 3) % 18)
        : fixture.accuracy;
    const requestedAiState = fixture.aiState ?? "COMPLETED";
    const aiConsent = requestedAiState !== "SKIPPED";
    const aiAnalyzedAt = aiConsent ? dateAfter(syncedAt, 1) : null;
    const aiCategory =
      requestedAiState === "COMPLETED" ? scenario.category : null;
    const aiUrgency =
      requestedAiState === "COMPLETED"
        ? fixture.critical
          ? "KRITIS"
          : scenario.urgency
        : null;
    const aiConfidence =
      requestedAiState === "COMPLETED" ? scenario.confidence : null;
    const assignedAt = dateAfter(syncedAt, 5 + (fixture.number % 12));
    const closedAt = dateAfter(assignedAt, 25 + (fixture.number % 17));
    const updatedAt =
      fixture.status === "SELESAI"
        ? closedAt
        : fixture.status === "DALAM_PENANGANAN"
          ? assignedAt
          : (aiAnalyzedAt ?? syncedAt);
    const tags = Prisma.sql`ARRAY[${Prisma.join(scenario.tags)}]::varchar(60)[]`;

    // The insert trigger captures the initial state before mock triage runs.
    await transaction.$executeRaw`
      WITH origin AS (
        SELECT ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326) AS location
      )
      INSERT INTO "field_reports" (
        "id", "client_report_id", "reporter_id", "zone_id", "latitude", "longitude",
        "accuracy_meters", "location", "image_path", "field_notes", "tags",
        "captured_at", "synced_at", "ai_consent", "ai_state", "handling_status",
        "nearest_water_distance_m", "is_demo_sample", "created_at", "updated_at"
      )
      SELECT
        ${reportId}::uuid, ${reportId}::uuid, ${relawan.id}::uuid,
        (
          SELECT zone."id"
          FROM "forest_zones" AS zone
          WHERE zone."is_demo_data" AND zone."is_approved"
            AND ST_Covers(zone."boundary", origin.location)
          ORDER BY zone."id"
          LIMIT 1
        ),
        ${latitude}, ${longitude}, ${accuracyMeters}::double precision,
        origin.location, ${imagePath}, ${`Simulasi patroli. ${fixture.notes}`},
        ${tags}, ${capturedAt}, ${syncedAt}, ${aiConsent},
        ${aiConsent ? "PENDING" : "SKIPPED"}::"AIAnalysisState",
        'MENUNGGU_TINDAKAN'::"HandlingStatus",
        (
          SELECT MIN(ST_Distance(point."location"::geography, origin.location::geography))
          FROM "water_points" AS point WHERE point."is_demo_data"
        ),
        true, ${syncedAt}, ${syncedAt}
      FROM origin
    `;

    const initialEvidence = await transaction.auditEvent.findFirstOrThrow({
      where: { reportId, eventType: "REPORT_EVIDENCE_RECORDED" },
      select: { createdAt: true },
    });
    // The database timestamps the evidence trigger at insertion time.
    // Use that clock for audit events, while status history shows demo field times.
    let offset = 0;
    const auditEvents: Prisma.AuditEventCreateManyInput[] = [];
    const appendAudit = (
      eventType: string,
      actorId: string | null,
      payload: Prisma.InputJsonObject,
    ) => {
      auditEvents.push({
        reportId,
        actorId,
        aggregateType: "FieldReport",
        aggregateId: reportId,
        eventType,
        payload: { ...payload, isDemoSample: true },
        createdAt: new Date(initialEvidence.createdAt.getTime() + ++offset),
      });
    };

    appendAudit("REPORT_CREATED", relawan.id, {
      source: "field_sync",
      aiConsent,
    });
    if (aiConsent) {
      appendAudit(`REPORT_AI_ANALYSIS_${requestedAiState}`, null, {
        provider: "demo",
        state: requestedAiState,
      });
    }

    const statusEvents: Prisma.ReportStatusEventCreateManyInput[] = [
      {
        reportId,
        changedById: relawan.id,
        nextStatus: "MENUNGGU_TINDAKAN",
        createdAt: syncedAt,
      },
    ];
    if (fixture.status !== "MENUNGGU_TINDAKAN") {
      statusEvents.push({
        reportId,
        changedById: posko.id,
        previousStatus: "MENUNGGU_TINDAKAN",
        nextStatus: "DALAM_PENANGANAN",
        note: scenario.responseNote,
        createdAt: assignedAt,
      });
      appendAudit("REPORT_STATUS_CHANGED", posko.id, {
        previousStatus: "MENUNGGU_TINDAKAN",
        nextStatus: "DALAM_PENANGANAN",
      });
    }
    if (fixture.status === "SELESAI") {
      statusEvents.push({
        reportId,
        changedById: posko.id,
        previousStatus: "DALAM_PENANGANAN",
        nextStatus: "SELESAI",
        note: scenario.closureNote,
        createdAt: closedAt,
      });
      appendAudit("REPORT_STATUS_CHANGED", posko.id, {
        previousStatus: "DALAM_PENANGANAN",
        nextStatus: "SELESAI",
      });
    }
    if (fixture.review) {
      appendAudit("MRV_EVIDENCE_REVIEWED", verifikator.id, {
        actorRole: verifikator.role,
        decision: fixture.review,
        evidenceSnapshot: {
          latitude,
          longitude,
          accuracyMeters,
          aiCategory,
          aiUrgency,
          aiConfidence,
          aiState: requestedAiState,
          capturedAt: capturedAt.toISOString(),
          syncedAt: syncedAt.toISOString(),
          photoPresent: imagePath !== "",
          photoSha256,
        },
      });
    }

    await transaction.fieldReport.update({
      where: { id: reportId },
      data: {
        aiState: requestedAiState,
        aiCategory,
        aiUrgency,
        aiConfidence,
        aiAnalyzedAt,
        ...(requestedAiState === "COMPLETED"
          ? {
              aiSummary: scenario.summary,
              aiVisualIndicators: [...scenario.indicators],
              aiFalsePositiveCheck: scenario.falsePositive,
              aiActionRecommendations: [...scenario.recommendations],
            }
          : {}),
        handlingStatus: fixture.status,
        updatedAt,
      },
    });
    await transaction.reportStatusEvent.createMany({ data: statusEvents });
    await transaction.auditEvent.createMany({ data: auditEvents });
    inserted += 1;
  }

  return { inserted, restoredPhotos };
}
