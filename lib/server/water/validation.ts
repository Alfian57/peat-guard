import { CommandApiError, isRecord, isUuid } from "@/lib/server/command/http";

export const WATER_POINT_TYPES = [
  "SEKAT_KANAL",
  "EMBUNG",
  "SUMBER_AIR",
] as const;

export type WaterPointType = (typeof WATER_POINT_TYPES)[number];

export type CreateWaterPointInput = {
  name: string;
  type: WaterPointType;
  latitude: number;
  longitude: number;
  zoneId: string | null;
};

export type UpdateWaterPointInput = Partial<CreateWaterPointInput>;

const ALLOWED_FIELDS = new Set([
  "name",
  "type",
  "latitude",
  "longitude",
  "zoneId",
]);

export function parseCreateWaterPointInput(
  value: unknown,
): CreateWaterPointInput {
  if (!isRecord(value)) {
    throw invalidWaterPointInput();
  }

  assertAllowedFields(value);

  return {
    name: readName(value.name),
    type: readType(value.type),
    latitude: readCoordinate(value.latitude, -90, 90),
    longitude: readCoordinate(value.longitude, -180, 180),
    zoneId: readZoneId(value.zoneId),
  };
}

export function parseUpdateWaterPointInput(
  value: unknown,
): UpdateWaterPointInput {
  if (!isRecord(value)) {
    throw invalidWaterPointInput();
  }

  assertAllowedFields(value);

  const result: UpdateWaterPointInput = {};

  if ("name" in value) {
    result.name = readName(value.name);
  }

  if ("type" in value) {
    result.type = readType(value.type);
  }

  if ("latitude" in value) {
    result.latitude = readCoordinate(value.latitude, -90, 90);
  }

  if ("longitude" in value) {
    result.longitude = readCoordinate(value.longitude, -180, 180);
  }

  if ("zoneId" in value) {
    result.zoneId = readZoneId(value.zoneId);
  }

  if (Object.keys(result).length === 0) {
    throw invalidWaterPointInput();
  }

  return result;
}

function readName(value: unknown): string {
  if (typeof value !== "string") {
    throw invalidWaterPointInput();
  }

  const name = value.trim();

  if (name.length === 0 || name.length > 150) {
    throw invalidWaterPointInput();
  }

  return name;
}

function readType(value: unknown): WaterPointType {
  if (typeof value !== "string" || !isWaterPointType(value)) {
    throw invalidWaterPointInput();
  }

  return value;
}

function isWaterPointType(value: string): value is WaterPointType {
  return WATER_POINT_TYPES.some((waterPointType) => waterPointType === value);
}

function readCoordinate(value: unknown, min: number, max: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    throw invalidWaterPointInput();
  }

  return value;
}

function readZoneId(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !isUuid(value)) {
    throw invalidWaterPointInput();
  }

  return value;
}

function assertAllowedFields(value: Record<string, unknown>): void {
  if (Object.keys(value).some((key) => !ALLOWED_FIELDS.has(key))) {
    throw invalidWaterPointInput();
  }
}

function invalidWaterPointInput(): CommandApiError {
  return new CommandApiError(
    400,
    "invalid_water_point_input",
    "Periksa kembali nama, jenis, koordinat, dan zona sumber air.",
  );
}
