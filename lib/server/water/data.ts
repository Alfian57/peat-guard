import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CommandApiError, databaseErrorCode } from "@/lib/server/command/http";
import type {
  CreateWaterPointInput,
  UpdateWaterPointInput,
  WaterPointType,
} from "@/lib/server/water/validation";

type WaterPointRow = {
  id: string;
  zoneId: string | null;
  zoneName: string | null;
  name: string;
  type: WaterPointType;
  latitude: number;
  longitude: number;
  isDemoData: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CommandWaterPoint = {
  id: string;
  zoneId: string | null;
  zoneName: string | null;
  name: string;
  type: WaterPointType;
  latitude: number;
  longitude: number;
  isDemoData: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listCommandWaterPoints(): Promise<CommandWaterPoint[]> {
  const rows = await queryWaterPoints(Prisma.sql``);
  return rows.map(toCommandWaterPoint);
}

export async function getCommandWaterPoint(
  waterPointId: string,
): Promise<CommandWaterPoint> {
  const rows = await queryWaterPoints(
    Prisma.sql`WHERE water_point.id = ${waterPointId}::uuid`,
  );
  const row = rows[0];

  if (!row) {
    throw new CommandApiError(
      404,
      "water_point_not_found",
      "Titik sumber air tidak ditemukan.",
    );
  }

  return toCommandWaterPoint(row);
}

export async function createCommandWaterPoint(
  input: CreateWaterPointInput,
): Promise<CommandWaterPoint> {
  let rows: Array<{ id: string }>;

  try {
    rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO water_points (
        id,
        zone_id,
        name,
        type,
        latitude,
        longitude,
        location,
        is_demo_data,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${input.zoneId}::uuid,
        ${input.name},
        ${input.type}::"WaterPointType",
        ${input.latitude},
        ${input.longitude},
        ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326),
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id::text AS id
    `);
  } catch (error) {
    throwZoneReferenceError(error);
  }

  return getCommandWaterPoint(rows[0].id);
}

export async function updateCommandWaterPoint(
  waterPointId: string,
  input: UpdateWaterPointInput,
): Promise<CommandWaterPoint> {
  const assignments: Prisma.Sql[] = [];

  if (input.zoneId !== undefined) {
    assignments.push(Prisma.sql`zone_id = ${input.zoneId}::uuid`);
  }

  if (input.name !== undefined) {
    assignments.push(Prisma.sql`name = ${input.name}`);
  }

  if (input.type !== undefined) {
    assignments.push(Prisma.sql`type = ${input.type}::"WaterPointType"`);
  }

  if (input.latitude !== undefined) {
    assignments.push(Prisma.sql`latitude = ${input.latitude}`);
  }

  if (input.longitude !== undefined) {
    assignments.push(Prisma.sql`longitude = ${input.longitude}`);
  }

  assignments.push(Prisma.sql`updated_at = CURRENT_TIMESTAMP`);

  let rows: Array<{ id: string }>;

  try {
    rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      WITH updated AS (
        UPDATE water_points
        SET ${Prisma.join(assignments, ", ")}
        WHERE id = ${waterPointId}::uuid
        RETURNING id
      )
      SELECT id::text AS id FROM updated
    `);
  } catch (error) {
    throwZoneReferenceError(error);
  }
  const row = rows[0];

  if (!row) {
    throw new CommandApiError(
      404,
      "water_point_not_found",
      "Titik sumber air tidak ditemukan.",
    );
  }

  return getCommandWaterPoint(row.id);
}

function throwZoneReferenceError(error: unknown): never {
  if (
    databaseErrorCode(error) === "23503" ||
    databaseErrorCode(error) === "P2003"
  ) {
    throw new CommandApiError(404, "zone_not_found", "Zona tidak ditemukan.");
  }

  throw error;
}

export async function deleteCommandWaterPoint(
  waterPointId: string,
): Promise<void> {
  try {
    await prisma.waterPoint.delete({ where: { id: waterPointId } });
  } catch (error) {
    if (databaseErrorCode(error) === "P2025") {
      throw new CommandApiError(
        404,
        "water_point_not_found",
        "Titik sumber air tidak ditemukan.",
      );
    }

    if (
      databaseErrorCode(error) === "23503" ||
      databaseErrorCode(error) === "P2003"
    ) {
      throw new CommandApiError(
        409,
        "water_point_in_use",
        "Titik sumber air sedang digunakan dan tidak dapat dihapus.",
      );
    }

    throw error;
  }
}

async function queryWaterPoints(where: Prisma.Sql): Promise<WaterPointRow[]> {
  return prisma.$queryRaw<WaterPointRow[]>(Prisma.sql`
    SELECT
      water_point.id::text AS id,
      water_point.zone_id::text AS "zoneId",
      zone.zone_name AS "zoneName",
      water_point.name,
      water_point.type::text AS type,
      water_point.latitude,
      water_point.longitude,
      water_point.is_demo_data AS "isDemoData",
      water_point.created_at AS "createdAt",
      water_point.updated_at AS "updatedAt"
    FROM water_points AS water_point
    LEFT JOIN forest_zones AS zone ON zone.id = water_point.zone_id
    ${where}
    ORDER BY water_point.name ASC
    LIMIT 1000
  `);
}

function toCommandWaterPoint(row: WaterPointRow): CommandWaterPoint {
  return {
    id: row.id,
    zoneId: row.zoneId,
    zoneName: row.zoneName,
    name: row.name,
    type: row.type,
    latitude: row.latitude,
    longitude: row.longitude,
    isDemoData: row.isDemoData,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
