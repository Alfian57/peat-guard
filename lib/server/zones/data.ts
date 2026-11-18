import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CommandApiError, databaseErrorCode } from "@/lib/server/command/http";
import type {
  CreateZoneInput,
  UpdateZoneInput,
  ZonePolygon,
} from "@/lib/server/zones/validation";
import { zoneSlug } from "@/lib/server/zones/validation";

type ZoneRow = {
  id: string;
  slug: string;
  zoneName: string;
  villageName: string | null;
  peatDepthMeters: number | string;
  areaHectares: number | string;
  carbonFactor: number | string;
  emissionFactor: number | string;
  incentivePerTonIdr: number | string;
  isApproved: boolean;
  isDemoData: boolean;
  geometryJson: string;
  reviewRevision: number;
  reviewNote: string | null;
  carbonParameterSetId: string;
  overlapsApprovedZone: boolean;
};

export type CommandZone = {
  id: string;
  slug: string;
  name: string;
  villageName: string | null;
  peatDepthMeters: number;
  areaHectares: number;
  carbonFactor: number;
  emissionFactor: number;
  incentivePerTonIdr: number;
  isApproved: boolean;
  isDemoData: boolean;
  geometry: ZonePolygon;
  reviewRevision?: number;
  reviewNote?: string | null;
  carbonParameterSetId?: string;
  overlapsApprovedZone?: boolean;
};

export async function listCommandZones(): Promise<CommandZone[]> {
  const rows = await queryZones(Prisma.sql`WHERE zone.archived_at IS NULL`);
  return rows.map(toCommandZone);
}

export async function listPendingZoneReviews() {
  const rows = await queryZones(
    Prisma.sql`WHERE zone.archived_at IS NULL AND NOT zone.is_approved AND zone.review_note IS NULL`,
  );
  return rows.map((row) => ({
    zone: toCommandZone(row),
    revision: row.reviewRevision,
  }));
}

export async function getCommandZone(zoneId: string): Promise<CommandZone> {
  const rows = await queryZones(
    Prisma.sql`WHERE zone.id = ${zoneId}::uuid AND zone.archived_at IS NULL`,
  );
  const row = rows[0];

  if (!row) {
    throw new CommandApiError(404, "zone_not_found", "Zona tidak ditemukan.");
  }

  return toCommandZone(row);
}

export async function createCommandZone(
  input: CreateZoneInput,
  actorId: string,
): Promise<CommandZone> {
  const parameterSet = await prisma.carbonParameterSet.findFirst({
    where: input.carbonParameterSetId
      ? { id: input.carbonParameterSetId }
      : { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!parameterSet) {
    throw new CommandApiError(
      409,
      "carbon_parameters_unavailable",
      "Parameter karbon aktif belum tersedia.",
    );
  }

  const id = randomUUID();
  const slug = zoneSlug(input.zoneName);

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw(Prisma.sql`
        INSERT INTO forest_zones (
          id,
          slug,
          zone_name,
          village_name,
          peat_depth_meters,
          boundary,
          carbon_parameter_set_id,
          is_approved,
          is_demo_data,
          created_at,
          updated_at
        ) VALUES (
          ${id}::uuid,
          ${slug},
          ${input.zoneName},
          ${input.villageName},
          ${input.peatDepthMeters},
          ST_SetSRID(
            ST_GeomFromGeoJSON(${JSON.stringify(input.geometry)}),
            4326
          )::geometry(Polygon, 4326),
          ${parameterSet.id}::uuid,
          FALSE,
          FALSE,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `);

      await transaction.auditEvent.create({
        data: {
          actorId,
          aggregateType: "ForestZone",
          aggregateId: id,
          eventType: "ZONE_CREATED",
          payload: { isApproved: false },
        },
      });
    });

    return getCommandZone(id);
  } catch (error) {
    throwZoneWriteError(error);
  }
}

export async function updateCommandZone(
  zoneId: string,
  input: UpdateZoneInput,
  actorId: string,
): Promise<CommandZone> {
  const assignments: Prisma.Sql[] = [];

  if (input.zoneName !== undefined) {
    assignments.push(Prisma.sql`zone_name = ${input.zoneName}`);
    assignments.push(Prisma.sql`slug = ${zoneSlug(input.zoneName)}`);
  }

  if (input.villageName !== undefined) {
    assignments.push(Prisma.sql`village_name = ${input.villageName}`);
  }

  if (input.peatDepthMeters !== undefined) {
    assignments.push(Prisma.sql`peat_depth_meters = ${input.peatDepthMeters}`);
  }

  if (input.geometry !== undefined) {
    assignments.push(Prisma.sql`
      boundary = ST_SetSRID(
        ST_GeomFromGeoJSON(${JSON.stringify(input.geometry)}),
        4326
      )::geometry(Polygon, 4326)
    `);
  }

  const approvalSensitiveChange =
    input.geometry !== undefined ||
    input.peatDepthMeters !== undefined ||
    input.carbonParameterSetId !== undefined;

  if (input.carbonParameterSetId !== undefined) {
    const parameter = await prisma.carbonParameterSet.findUnique({
      where: { id: input.carbonParameterSetId },
      select: { id: true },
    });
    if (!parameter)
      throw new CommandApiError(
        422,
        "invalid_carbon_parameters",
        "Versi parameter tidak ditemukan.",
      );
    assignments.push(
      Prisma.sql`carbon_parameter_set_id = ${parameter.id}::uuid`,
    );
  }

  assignments.push(
    Prisma.sql`review_note = NULL, updated_at = CURRENT_TIMESTAMP, review_revision = review_revision + 1`,
  );

  try {
    const changedFields = Object.keys(input).filter(
      (field) => field !== "expectedRevision",
    );
    const changed = await prisma.$transaction(async (transaction) => {
      const currentRows = await transaction.$queryRaw<
        Array<{ id: string; isApproved: boolean; reviewRevision: number }>
      >(Prisma.sql`
        SELECT id::text AS id, is_approved AS "isApproved", review_revision AS "reviewRevision"
        FROM forest_zones
        WHERE id = ${zoneId}::uuid AND archived_at IS NULL
        FOR UPDATE
      `);
      const current = currentRows[0];

      if (!current) {
        throw new CommandApiError(
          404,
          "zone_not_found",
          "Zona tidak ditemukan.",
        );
      }

      if (
        input.expectedRevision !== undefined &&
        input.expectedRevision !== current.reviewRevision
      )
        throw reviewConflict();

      const revokeApproval = current.isApproved && approvalSensitiveChange;

      if (revokeApproval) {
        assignments.push(Prisma.sql`is_approved = FALSE`);
      }

      const rows = await transaction.$queryRaw<ZoneRow[]>(Prisma.sql`
        WITH updated AS (
          UPDATE forest_zones
          SET ${Prisma.join(assignments, ", ")}
          WHERE id = ${zoneId}::uuid
          RETURNING *
        )
        SELECT
          zone.id::text AS id,
          zone.slug,
          zone.zone_name AS "zoneName",
          zone.village_name AS "villageName",
          zone.peat_depth_meters::double precision AS "peatDepthMeters",
          zone.area_hectares::double precision AS "areaHectares",
          parameters.biomass_factor::double precision AS "carbonFactor",
          parameters.emission_factor::double precision AS "emissionFactor",
          parameters.incentive_per_ton_idr::double precision AS "incentivePerTonIdr",
          zone.is_approved AS "isApproved",
          zone.is_demo_data AS "isDemoData",
          zone.review_revision AS "reviewRevision",
          zone.review_note AS "reviewNote",
          zone.carbon_parameter_set_id::text AS "carbonParameterSetId",
          ${zoneConflictSql} AS "overlapsApprovedZone",
          ST_AsGeoJSON(zone.boundary) AS "geometryJson"
        FROM updated AS zone
        INNER JOIN carbon_parameter_sets AS parameters
          ON parameters.id = zone.carbon_parameter_set_id
      `);
      const row = rows[0];

      if (!row) {
        throw new CommandApiError(
          404,
          "zone_not_found",
          "Zona tidak ditemukan.",
        );
      }

      await transaction.auditEvent.create({
        data: {
          actorId,
          aggregateType: "ForestZone",
          aggregateId: zoneId,
          eventType: "ZONE_UPDATED",
          payload: { changedFields },
        },
      });

      if (revokeApproval) {
        await transaction.auditEvent.create({
          data: {
            actorId,
            aggregateType: "ForestZone",
            aggregateId: zoneId,
            eventType: "ZONE_UNAPPROVED",
            payload: { reason: "verified_spatial_parameters_changed" },
          },
        });
      }

      return row;
    });

    return toCommandZone(changed);
  } catch (error) {
    throwZoneWriteError(error);
  }
}

function reviewConflict() {
  return new CommandApiError(
    409,
    "zone_revision_conflict",
    "Data zona berubah. Muat ulang dan tinjau revisi terbaru.",
  );
}

const zoneConflictSql = Prisma.sql`EXISTS (
  SELECT 1 FROM forest_zones other
  WHERE zone.is_approved AND other.id <> zone.id AND other.is_approved AND other.archived_at IS NULL
    AND other.boundary && zone.boundary AND ST_Relate(other.boundary, zone.boundary, '2********')
)`;

export async function requestZoneRevision(
  zoneId: string,
  actorId: string,
  expectedRevision: number,
  note: string,
) {
  return prisma.$transaction(async (transaction) => {
    const result = await transaction.forestZone.updateMany({
      where: {
        id: zoneId,
        reviewRevision: expectedRevision,
        archivedAt: null,
        isApproved: false,
        reviewNote: null,
      },
      data: { reviewNote: note, reviewRevision: { increment: 1 } },
    });
    if (!result.count) throw reviewConflict();
    await transaction.auditEvent.create({
      data: {
        actorId,
        aggregateType: "ForestZone",
        aggregateId: zoneId,
        eventType: "ZONE_CHANGES_REQUESTED",
        payload: { note, revision: expectedRevision },
      },
    });
  });
}

export async function approveCommandZone(
  zoneId: string,
  actorId: string,
  expectedRevision: number,
): Promise<{ zone: CommandZone; alreadyApproved: boolean }> {
  return prisma.$transaction((transaction) =>
    approveZoneReview(transaction, zoneId, actorId, expectedRevision),
  );
}

export async function approveZoneReview(
  transaction: Prisma.TransactionClient,
  zoneId: string,
  actorId: string,
  expectedRevision: number,
): Promise<{ zone: CommandZone; alreadyApproved: boolean }> {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(186202611, 20)`;
  await transaction.$queryRaw`SELECT id FROM forest_zones WHERE id = ${zoneId}::uuid FOR UPDATE`;
  const [current] = await queryZones(
    Prisma.sql`WHERE zone.id = ${zoneId}::uuid AND zone.archived_at IS NULL`,
    transaction,
  );
  if (!current)
    throw new CommandApiError(404, "zone_not_found", "Zona tidak ditemukan.");
  if (current.reviewRevision !== expectedRevision || current.reviewNote)
    throw reviewConflict();
  if (current.isApproved)
    return { zone: toCommandZone(current), alreadyApproved: true };

  const conflicts = await transaction.$queryRaw<Array<{ name: string }>>`
    SELECT other.zone_name AS name FROM forest_zones zone
    JOIN forest_zones other ON other.id <> zone.id AND other.boundary && zone.boundary
    WHERE zone.id = ${zoneId}::uuid AND other.is_approved AND other.archived_at IS NULL
      AND ST_Relate(other.boundary, zone.boundary, '2********')
    ORDER BY other.zone_name LIMIT 5
  `;
  if (conflicts.length)
    throw new CommandApiError(
      409,
      "zone_overlap",
      `Batas bertumpang tindih dengan ${conflicts.map(({ name }) => name).join(", ")}. Minta Posko memperbaiki batas.`,
    );

  await transaction.$executeRaw`
      UPDATE forest_zones SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${zoneId}::uuid
    `;
  await transaction.auditEvent.create({
    data: {
      actorId,
      aggregateType: "ForestZone",
      aggregateId: zoneId,
      eventType: "ZONE_APPROVED",
      payload: {
        previousApproval: false,
        nextApproval: true,
        revision: expectedRevision,
      },
    },
  });
  return {
    zone: toCommandZone({ ...current, isApproved: true }),
    alreadyApproved: false,
  };
}

export async function archiveCommandZone(
  zoneId: string,
  actorId: string,
): Promise<void> {
  await prisma.$transaction((transaction) =>
    archiveZone(transaction, zoneId, actorId),
  );
}

export async function archiveZone(
  transaction: Prisma.TransactionClient,
  zoneId: string,
  actorId: string,
): Promise<void> {
  const [zone] = await transaction.$queryRaw<
    Array<{ archivedAt: Date | null }>
  >`
      SELECT archived_at AS "archivedAt" FROM forest_zones WHERE id = ${zoneId}::uuid FOR UPDATE
    `;
  if (!zone)
    throw new CommandApiError(404, "zone_not_found", "Zona tidak ditemukan.");
  if (zone.archivedAt) return;

  const [references] = await transaction.$queryRaw<Array<{ inUse: boolean }>>`
      SELECT EXISTS (SELECT 1 FROM field_reports WHERE zone_id = ${zoneId}::uuid)
        OR EXISTS (SELECT 1 FROM water_points WHERE zone_id = ${zoneId}::uuid) AS "inUse"
    `;
  if (references?.inUse) {
    throw new CommandApiError(
      409,
      "zone_in_use",
      "Zona masih digunakan oleh laporan atau titik sumber air.",
    );
  }

  await transaction.$executeRaw`
      UPDATE forest_zones SET archived_at = clock_timestamp(), is_approved = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${zoneId}::uuid
    `;
  await transaction.auditEvent.create({
    data: {
      actorId,
      aggregateType: "ForestZone",
      aggregateId: zoneId,
      eventType: "ZONE_ARCHIVED",
    },
  });
}

async function queryZones(
  where: Prisma.Sql,
  database: Prisma.TransactionClient = prisma,
): Promise<ZoneRow[]> {
  return database.$queryRaw<ZoneRow[]>(Prisma.sql`
    SELECT
      zone.id::text AS id,
      zone.slug,
      zone.zone_name AS "zoneName",
      zone.village_name AS "villageName",
      zone.peat_depth_meters::double precision AS "peatDepthMeters",
      zone.area_hectares::double precision AS "areaHectares",
      parameters.biomass_factor::double precision AS "carbonFactor",
      parameters.emission_factor::double precision AS "emissionFactor",
      parameters.incentive_per_ton_idr::double precision AS "incentivePerTonIdr",
      zone.is_approved AS "isApproved",
      zone.is_demo_data AS "isDemoData",
          zone.review_revision AS "reviewRevision",
          zone.review_note AS "reviewNote",
          zone.carbon_parameter_set_id::text AS "carbonParameterSetId",
          ${zoneConflictSql} AS "overlapsApprovedZone",
      ST_AsGeoJSON(zone.boundary) AS "geometryJson"
    FROM forest_zones AS zone
    INNER JOIN carbon_parameter_sets AS parameters
      ON parameters.id = zone.carbon_parameter_set_id
    ${where}
    ORDER BY zone.zone_name ASC
    LIMIT 500
  `);
}

function toCommandZone(row: ZoneRow): CommandZone {
  return {
    id: row.id,
    slug: row.slug,
    name: row.zoneName,
    villageName: row.villageName,
    peatDepthMeters: Number(row.peatDepthMeters),
    areaHectares: Number(row.areaHectares),
    carbonFactor: Number(row.carbonFactor),
    emissionFactor: Number(row.emissionFactor),
    incentivePerTonIdr: Number(row.incentivePerTonIdr),
    isApproved: row.isApproved,
    isDemoData: row.isDemoData,
    carbonParameterSetId: row.carbonParameterSetId,
    reviewRevision: row.reviewRevision,
    reviewNote: row.reviewNote,
    overlapsApprovedZone: row.overlapsApprovedZone,
    geometry: JSON.parse(row.geometryJson) as ZonePolygon,
  };
}

function throwZoneWriteError(error: unknown): never {
  const code = databaseErrorCode(error);

  if (code === "23505" || code === "P2002") {
    throw new CommandApiError(
      409,
      "zone_name_conflict",
      "Nama zona tersebut sudah digunakan.",
    );
  }

  if (code === "23514" || code === "22023") {
    throw new CommandApiError(
      400,
      "invalid_zone_geometry",
      "Batas zona tidak valid atau tidak dapat diproses.",
    );
  }

  throw error;
}
