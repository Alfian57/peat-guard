import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@/app/generated/prisma/client";
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
};

export async function listCommandZones(): Promise<CommandZone[]> {
  const rows = await prisma.$queryRaw<ZoneRow[]>`
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
      ST_AsGeoJSON(zone.boundary) AS "geometryJson"
    FROM forest_zones AS zone
    INNER JOIN carbon_parameter_sets AS parameters
      ON parameters.id = zone.carbon_parameter_set_id
    ORDER BY zone.zone_name ASC
    LIMIT 500
  `;

  return rows.map(toCommandZone);
}

export async function getCommandZone(zoneId: string): Promise<CommandZone> {
  const rows = await queryZones(Prisma.sql`WHERE zone.id = ${zoneId}::uuid`);
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
    where: { isActive: true },
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
    input.geometry !== undefined || input.peatDepthMeters !== undefined;

  assignments.push(Prisma.sql`updated_at = CURRENT_TIMESTAMP`);

  try {
    const changedFields = Object.keys(input);
    const changed = await prisma.$transaction(async (transaction) => {
      const currentRows = await transaction.$queryRaw<
        Array<{ id: string; isApproved: boolean }>
      >(Prisma.sql`
        SELECT id::text AS id, is_approved AS "isApproved"
        FROM forest_zones
        WHERE id = ${zoneId}::uuid
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

export async function approveCommandZone(
  zoneId: string,
  actorId: string,
): Promise<{ zone: CommandZone; alreadyApproved: boolean }> {
  const updated = await prisma.$transaction(async (transaction) => {
    const rows = await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE forest_zones
      SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${zoneId}::uuid AND is_approved = FALSE
      RETURNING id::text AS id
    `);

    if (rows.length > 0) {
      await transaction.auditEvent.create({
        data: {
          actorId,
          aggregateType: "ForestZone",
          aggregateId: zoneId,
          eventType: "ZONE_APPROVED",
          payload: { previousApproval: false, nextApproval: true },
        },
      });

      return { changed: true };
    }

    const existing = await transaction.forestZone.findUnique({
      where: { id: zoneId },
      select: { isApproved: true },
    });

    if (!existing) {
      throw new CommandApiError(404, "zone_not_found", "Zona tidak ditemukan.");
    }

    return { changed: false };
  });

  return {
    zone: await getCommandZone(zoneId),
    alreadyApproved: !updated.changed,
  };
}

export async function deleteCommandZone(
  zoneId: string,
  actorId: string,
): Promise<void> {
  try {
    await prisma.$transaction(async (transaction) => {
      const existing = await transaction.forestZone.findUnique({
        where: { id: zoneId },
        select: { id: true },
      });

      if (!existing) {
        throw new CommandApiError(
          404,
          "zone_not_found",
          "Zona tidak ditemukan.",
        );
      }

      await transaction.forestZone.delete({ where: { id: zoneId } });
      await transaction.auditEvent.create({
        data: {
          actorId,
          aggregateType: "ForestZone",
          aggregateId: zoneId,
          eventType: "ZONE_DELETED",
        },
      });
    });
  } catch (error) {
    if (
      databaseErrorCode(error) === "23503" ||
      databaseErrorCode(error) === "P2003"
    ) {
      throw new CommandApiError(
        409,
        "zone_in_use",
        "Zona masih digunakan oleh laporan atau titik sumber air.",
      );
    }

    throw error;
  }
}

async function queryZones(where: Prisma.Sql): Promise<ZoneRow[]> {
  return prisma.$queryRaw<ZoneRow[]>(Prisma.sql`
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
