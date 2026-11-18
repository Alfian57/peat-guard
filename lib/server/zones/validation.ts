import { CommandApiError, isRecord, isUuid } from "@/lib/server/command/http";

export type ZonePolygon = {
  type: "Polygon";
  coordinates: [number, number][][];
};

export type CreateZoneInput = {
  zoneName: string;
  villageName: string | null;
  peatDepthMeters: number;
  geometry: ZonePolygon;
  carbonParameterSetId?: string;
};

export type UpdateZoneInput = Partial<CreateZoneInput> & {
  expectedRevision?: number;
};

const ZONE_CREATE_FIELDS = new Set([
  "zoneName",
  "villageName",
  "peatDepthMeters",
  "geometry",
  "carbonParameterSetId",
]);

export function parseCreateZoneInput(value: unknown): CreateZoneInput {
  if (!isRecord(value)) {
    throw invalidZoneInput();
  }

  assertOnlyFields(value, ZONE_CREATE_FIELDS);

  const zoneName = readText(value.zoneName, 150, true);
  const villageName = readNullableText(value.villageName, 100);
  const peatDepthMeters = readPeatDepth(value.peatDepthMeters ?? 1.5);
  const geometry = parsePolygon(value.geometry);

  const carbonParameterSetId = readParameterSetId(value.carbonParameterSetId);
  return {
    zoneName,
    villageName,
    peatDepthMeters,
    geometry,
    ...(carbonParameterSetId ? { carbonParameterSetId } : {}),
  };
}

export function parseUpdateZoneInput(value: unknown): UpdateZoneInput {
  if (!isRecord(value)) {
    throw invalidZoneInput();
  }

  assertOnlyFields(value, new Set([...ZONE_CREATE_FIELDS, "expectedRevision"]));

  const result: UpdateZoneInput = {};

  if ("zoneName" in value) {
    result.zoneName = readText(value.zoneName, 150, true);
  }

  if ("villageName" in value) {
    result.villageName = readNullableText(value.villageName, 100);
  }

  if ("peatDepthMeters" in value) {
    result.peatDepthMeters = readPeatDepth(value.peatDepthMeters);
  }

  if ("geometry" in value) {
    result.geometry = parsePolygon(value.geometry);
  }

  if ("carbonParameterSetId" in value) {
    result.carbonParameterSetId = readParameterSetId(
      value.carbonParameterSetId,
    );
  }
  if ("expectedRevision" in value) {
    const revision = value.expectedRevision;
    if (
      typeof revision !== "number" ||
      !Number.isSafeInteger(revision) ||
      revision < 0
    ) {
      throw invalidZoneInput();
    }
    result.expectedRevision = revision;
  }
  if (
    Object.keys(result).length ===
    (result.expectedRevision === undefined ? 0 : 1)
  )
    throw invalidZoneInput();
  return result;
}

function readParameterSetId(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !isUuid(value)) throw invalidZoneInput();
  return value;
}

export function zoneSlug(zoneName: string): string {
  const slug = zoneName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
    .replace(/-$/g, "");

  return slug || "zona-gambut";
}

function parsePolygon(value: unknown): ZonePolygon {
  if (
    !isRecord(value) ||
    value.type !== "Polygon" ||
    !Array.isArray(value.coordinates)
  ) {
    throw invalidZoneInput();
  }

  const coordinates: [number, number][][] = [];
  let vertexCount = 0;

  for (const ringValue of value.coordinates) {
    if (!Array.isArray(ringValue) || ringValue.length < 4) {
      throw invalidZoneInput();
    }

    const ring: [number, number][] = [];

    for (const positionValue of ringValue) {
      if (!Array.isArray(positionValue) || positionValue.length !== 2) {
        throw invalidZoneInput();
      }

      const [longitude, latitude] = positionValue;

      if (
        typeof longitude !== "number" ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180 ||
        typeof latitude !== "number" ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        throw invalidZoneInput();
      }

      ring.push([longitude, latitude]);
      vertexCount += 1;
    }

    if (!samePosition(ring[0], ring.at(-1))) {
      throw invalidZoneInput();
    }

    const uniqueVertices = new Set(
      ring
        .slice(0, -1)
        .map(([longitude, latitude]) => `${longitude},${latitude}`),
    );

    if (uniqueVertices.size < 3) {
      throw invalidZoneInput();
    }

    coordinates.push(ring);
  }

  if (coordinates.length === 0 || vertexCount > 10_000) {
    throw invalidZoneInput();
  }

  return { type: "Polygon", coordinates };
}

function samePosition(
  left: [number, number] | undefined,
  right: [number, number] | undefined,
): boolean {
  return Boolean(left && right && left[0] === right[0] && left[1] === right[1]);
}

function readText(value: unknown, maxLength: number, required: true): string;
function readText(
  value: unknown,
  maxLength: number,
  required: false,
): string | null;
function readText(
  value: unknown,
  maxLength: number,
  required: boolean,
): string | null {
  if (typeof value !== "string") {
    if (!required && value === undefined) {
      return null;
    }

    throw invalidZoneInput();
  }

  const text = value.trim();

  if ((required && text.length === 0) || text.length > maxLength) {
    throw invalidZoneInput();
  }

  return text || null;
}

function readNullableText(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  return readText(value, maxLength, false);
}

function readPeatDepth(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 20
  ) {
    throw invalidZoneInput();
  }

  return Math.round(value * 100) / 100;
}

function assertOnlyFields(
  value: Record<string, unknown>,
  allowedFields: ReadonlySet<string>,
): void {
  if (Object.keys(value).some((key) => !allowedFields.has(key))) {
    throw invalidZoneInput();
  }
}

function invalidZoneInput(): CommandApiError {
  return new CommandApiError(
    400,
    "invalid_zone_input",
    "Periksa kembali nama, kedalaman gambut, dan batas zona.",
  );
}
