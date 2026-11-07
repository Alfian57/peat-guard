import { randomUUID } from "node:crypto";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { MapPoint } from "@/lib/maps/types";
import type { FirmsHotspot } from "@/lib/server/firms/csv";
import type { AreaBounds } from "@/lib/server/firms/client";
import { isRecord } from "@/lib/server/command/http";
import { evaluateFirmsSyncRateLimit } from "@/lib/server/firms/rate-limit";

const SYNC_AGGREGATE_TYPE = "NASA_FIRMS_SYNC";
const SYNC_RATE_LIMIT_AGGREGATE_ID = "f1a1f1a1-0000-4000-8000-000000000001";
const UPSERT_CHUNK_SIZE = 400;

export type FirmsSyncStatus = {
  configured: boolean;
  lastSuccessfulAt: string | null;
  lastAttemptAt: string | null;
  lastErrorCode: string | null;
  lastProcessedCount: number | null;
  storedHotspotCount: number;
};

export type CommandHotspot = MapPoint & {
  source: string;
  acquiredAt: string;
  fetchedAt: string;
  confidence: string | null;
  brightnessKelvin: number | null;
};

export async function reserveFirmsSyncSlot(args: {
  actorId: string | null;
  intervalMinutes: number;
}): Promise<ReturnType<typeof evaluateFirmsSyncRateLimit>> {
  return prisma.$transaction(async (transaction) => {
    // This advisory lock coordinates web and worker processes sharing Postgres.
    await transaction.$queryRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(1_862_026_11, 1)`,
    );

    const [clock] = await transaction.$queryRaw<Array<{ now: Date }>>`
      SELECT clock_timestamp() AS now
    `;
    const lastStarted = await transaction.auditEvent.findFirst({
      where: {
        aggregateType: SYNC_AGGREGATE_TYPE,
        aggregateId: SYNC_RATE_LIMIT_AGGREGATE_ID,
        eventType: "FIRMS_SYNC_STARTED",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const decision = evaluateFirmsSyncRateLimit({
      lastStartedAt: lastStarted?.createdAt ?? null,
      now: clock.now,
      intervalMinutes: args.intervalMinutes,
    });

    if (!decision.allowed) {
      return decision;
    }

    await transaction.$executeRaw(Prisma.sql`
      INSERT INTO audit_events (
        id,
        actor_id,
        aggregate_type,
        aggregate_id,
        event_type,
        payload,
        created_at
      ) VALUES (
        ${randomUUID()}::uuid,
        ${args.actorId}::uuid,
        ${SYNC_AGGREGATE_TYPE},
        ${SYNC_RATE_LIMIT_AGGREGATE_ID}::uuid,
        'FIRMS_SYNC_STARTED',
        '{}'::jsonb,
        clock_timestamp()
      )
    `);

    return decision;
  });
}

export async function upsertAndRecordSuccess(args: {
  hotspots: FirmsHotspot[];
  actorId: string | null;
  area: AreaBounds;
}): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    for (
      let start = 0;
      start < args.hotspots.length;
      start += UPSERT_CHUNK_SIZE
    ) {
      const chunk = args.hotspots.slice(start, start + UPSERT_CHUNK_SIZE);
      const values = chunk.map(
        (hotspot) => Prisma.sql`(
        ${randomUUID()}::uuid,
        ${hotspot.source},
        ${hotspot.externalId},
        ${hotspot.latitude},
        ${hotspot.longitude},
        ST_SetSRID(ST_MakePoint(${hotspot.longitude}, ${hotspot.latitude}), 4326),
        ${hotspot.brightnessKelvin},
        ${hotspot.confidence},
        ${hotspot.acquiredAt},
        CURRENT_TIMESTAMP,
        FALSE
      )`,
      );

      await transaction.$executeRaw(Prisma.sql`
        INSERT INTO satellite_hotspots (
          id,
          source,
          external_id,
          latitude,
          longitude,
          location,
          brightness_kelvin,
          confidence,
          acquired_at,
          fetched_at,
          is_demo_data
        ) VALUES ${Prisma.join(values, ", ")}
        ON CONFLICT (source, external_id) DO UPDATE SET
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          location = EXCLUDED.location,
          brightness_kelvin = EXCLUDED.brightness_kelvin,
          confidence = EXCLUDED.confidence,
          acquired_at = EXCLUDED.acquired_at,
          fetched_at = CURRENT_TIMESTAMP,
          is_demo_data = FALSE
      `);
    }

    await transaction.auditEvent.create({
      data: {
        actorId: args.actorId,
        aggregateType: SYNC_AGGREGATE_TYPE,
        aggregateId: randomUUID(),
        eventType: "FIRMS_SYNC_SUCCEEDED",
        payload: {
          processedCount: args.hotspots.length,
          sources: Array.from(
            new Set(args.hotspots.map(({ source }) => source)),
          ),
          area: args.area,
        },
      },
    });
  });
}

export async function recordSyncFailure(args: {
  actorId: string | null;
  errorCode: string;
}): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actorId: args.actorId,
      aggregateType: SYNC_AGGREGATE_TYPE,
      aggregateId: randomUUID(),
      eventType: "FIRMS_SYNC_FAILED",
      payload: { errorCode: args.errorCode },
    },
  });
}

export async function getFirmsSyncStatus(
  configured: boolean,
): Promise<FirmsSyncStatus> {
  const [latestSuccess, latestAttempt, storedHotspotCount] = await Promise.all([
    prisma.auditEvent.findFirst({
      where: {
        aggregateType: SYNC_AGGREGATE_TYPE,
        eventType: "FIRMS_SYNC_SUCCEEDED",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, payload: true },
    }),
    prisma.auditEvent.findFirst({
      where: { aggregateType: SYNC_AGGREGATE_TYPE },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, eventType: true, payload: true },
    }),
    prisma.satelliteHotspot.count({ where: { isDemoData: false } }),
  ]);
  const successPayload = isRecord(latestSuccess?.payload)
    ? latestSuccess.payload
    : null;
  const attemptPayload = isRecord(latestAttempt?.payload)
    ? latestAttempt.payload
    : null;

  return {
    configured,
    lastSuccessfulAt: latestSuccess?.createdAt.toISOString() ?? null,
    lastAttemptAt: latestAttempt?.createdAt.toISOString() ?? null,
    lastErrorCode:
      latestAttempt?.eventType === "FIRMS_SYNC_FAILED" &&
      typeof attemptPayload?.errorCode === "string"
        ? attemptPayload.errorCode
        : null,
    lastProcessedCount:
      typeof successPayload?.processedCount === "number"
        ? successPayload.processedCount
        : null,
    storedHotspotCount,
  };
}

export async function listCommandHotspots(): Promise<CommandHotspot[]> {
  const hotspots = await prisma.satelliteHotspot.findMany({
    orderBy: { acquiredAt: "desc" },
    take: 1000,
    select: {
      id: true,
      source: true,
      latitude: true,
      longitude: true,
      brightnessKelvin: true,
      confidence: true,
      acquiredAt: true,
      fetchedAt: true,
      isDemoData: true,
    },
  });

  return hotspots.map((hotspot) => ({
    id: hotspot.id,
    coordinates: [hotspot.longitude, hotspot.latitude],
    kind: "hotspot",
    label: hotspot.isDemoData ? "Titik panas contoh" : "NASA FIRMS hotspot",
    description: [
      hotspot.isDemoData ? "Ilustrasi sintetis" : "NASA FIRMS",
      hotspot.confidence ? `Keyakinan ${hotspot.confidence}` : null,
      hotspot.brightnessKelvin !== null
        ? `${Number(hotspot.brightnessKelvin)} K`
        : null,
      hotspot.acquiredAt.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }),
    ]
      .filter(Boolean)
      .join(" · "),
    source: hotspot.source,
    isDemoData: hotspot.isDemoData,
    acquiredAt: hotspot.acquiredAt.toISOString(),
    fetchedAt: hotspot.fetchedAt.toISOString(),
    confidence: hotspot.confidence,
    brightnessKelvin:
      hotspot.brightnessKelvin === null
        ? null
        : Number(hotspot.brightnessKelvin),
  }));
}
