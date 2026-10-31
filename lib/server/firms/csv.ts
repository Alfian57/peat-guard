import { createHash } from "node:crypto";

export const FIRMS_SOURCES = [
  "VIIRS_SNPP_NRT",
  "VIIRS_NOAA20_NRT",
  "VIIRS_NOAA21_NRT",
] as const;

export type FirmsSource = (typeof FIRMS_SOURCES)[number];

export type FirmsHotspot = {
  source: FirmsSource;
  externalId: string;
  latitude: number;
  longitude: number;
  brightnessKelvin: number | null;
  confidence: string | null;
  acquiredAt: Date;
};

export class FirmsDataError extends Error {
  constructor(readonly code: string) {
    super("NASA FIRMS returned data that did not match the expected format.");
    this.name = "FirmsDataError";
  }
}

const MAX_CSV_BYTES = 20_000_000;
const REQUIRED_HEADERS = [
  "latitude",
  "longitude",
  "acq_date",
  "acq_time",
] as const;

export function parseFirmsCsv(
  csv: string,
  source: FirmsSource,
): FirmsHotspot[] {
  if (Buffer.byteLength(csv, "utf8") > MAX_CSV_BYTES) {
    throw new FirmsDataError("response_too_large");
  }

  const rows = readCsvRows(csv.replace(/^\uFEFF/, ""));
  const header = rows.shift()?.map((value) => value.trim().toLowerCase());

  if (
    !header ||
    REQUIRED_HEADERS.some((required) => !header.includes(required))
  ) {
    throw new FirmsDataError("missing_required_columns");
  }

  const indices = new Map(header.map((name, index) => [name, index]));
  const unique = new Map<string, FirmsHotspot>();

  for (const row of rows) {
    if (row.every((value) => value.trim() === "")) {
      continue;
    }

    if (row.length !== header.length) {
      throw new FirmsDataError("column_count_mismatch");
    }

    const latitude = parseFiniteNumber(field(row, indices, "latitude"));
    const longitude = parseFiniteNumber(field(row, indices, "longitude"));

    if (
      latitude === null ||
      longitude === null ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new FirmsDataError("invalid_coordinates");
    }

    const acqDate = field(row, indices, "acq_date");
    const acqTime = field(row, indices, "acq_time");
    const acquiredAt = parseAcquiredAt(acqDate, acqTime);

    if (!acquiredAt) {
      throw new FirmsDataError("invalid_acquisition_time");
    }

    const brightnessKelvin = parseOptionalFiniteNumber(
      firstPresentField(row, indices, [
        "bright_ti4",
        "bright_t31",
        "brightness",
      ]),
    );

    if (brightnessKelvin === INVALID_NUMBER) {
      throw new FirmsDataError("invalid_brightness");
    }

    const satellite = field(row, indices, "satellite");
    const instrument = field(row, indices, "instrument");
    const version = field(row, indices, "version");
    const identity = [
      source,
      satellite,
      instrument,
      acqDate,
      String(acqTime).padStart(4, "0"),
      latitude.toFixed(5),
      longitude.toFixed(5),
      version,
    ].join("|");
    const externalId = createHash("sha256").update(identity).digest("hex");

    unique.set(externalId, {
      source,
      externalId,
      latitude,
      longitude,
      brightnessKelvin,
      confidence: normalizeConfidence(field(row, indices, "confidence")),
      acquiredAt,
    });
  }

  return Array.from(unique.values());
}

const INVALID_NUMBER = Symbol("invalid-number");

function parseOptionalFiniteNumber(
  value: string | undefined,
): number | null | typeof INVALID_NUMBER {
  if (value === undefined || value.trim() === "") {
    return null;
  }

  return parseFiniteNumber(value) ?? INVALID_NUMBER;
}

function parseFiniteNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseAcquiredAt(
  date: string | undefined,
  time: string | undefined,
): Date | null {
  if (
    !date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !time ||
    !/^\d{1,4}$/.test(time)
  ) {
    return null;
  }

  const paddedTime = time.padStart(4, "0");
  const hours = Number(paddedTime.slice(0, 2));
  const minutes = Number(paddedTime.slice(2, 4));

  if (hours > 23 || minutes > 59) {
    return null;
  }

  const acquiredAt = new Date(
    `${date}T${paddedTime.slice(0, 2)}:${paddedTime.slice(2, 4)}:00.000Z`,
  );

  if (
    !Number.isFinite(acquiredAt.getTime()) ||
    acquiredAt.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  return acquiredAt;
}

function normalizeConfidence(value: string | undefined): string | null {
  const confidence = value?.trim().toLowerCase();

  if (!confidence) {
    return null;
  }

  if (confidence === "h") {
    return "high";
  }

  if (confidence === "n") {
    return "nominal";
  }

  if (confidence === "l") {
    return "low";
  }

  if (/^\d{1,3}$/.test(confidence) && Number(confidence) <= 100) {
    return confidence;
  }

  throw new FirmsDataError("invalid_confidence");
}

function firstPresentField(
  row: string[],
  indices: Map<string, number>,
  candidates: readonly string[],
): string | undefined {
  for (const candidate of candidates) {
    const value = field(row, indices, candidate);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function field(
  row: string[],
  indices: Map<string, number>,
  name: string,
): string | undefined {
  const index = indices.get(name);
  return index === undefined ? undefined : row[index];
}

function readCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"' && csv[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        value += character;
      }

      continue;
    }

    if (character === '"') {
      if (value.length > 0) {
        throw new FirmsDataError("malformed_csv");
      }

      inQuotes = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (inQuotes) {
    throw new FirmsDataError("malformed_csv");
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}
