import {
  FirmsDataError,
  parseFirmsCsv,
  type FirmsHotspot,
} from "@/lib/server/firms/csv";
import { FirmsProviderError } from "@/lib/server/firms/errors";
import {
  FIRMS_INGEST_SOURCES,
  type FirmsIngestSource,
} from "@/lib/firms-sources";

export type AreaBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

const DEFAULT_AREA: AreaBounds = {
  west: 109,
  south: -5,
  east: 117,
  north: 2,
};
const DAY_RANGE = 2;
const MAX_RESPONSE_BYTES = 20_000_000;
const REQUEST_TIMEOUT_MS = 20_000;

export function getFirmsConfiguration(): {
  apiKey: string | null;
  area: AreaBounds;
} {
  const apiKey = process.env.NASA_FIRMS_MAP_KEY?.trim() || null;

  if (!apiKey) {
    return { apiKey: null, area: DEFAULT_AREA };
  }

  const areaValue = process.env.NASA_FIRMS_AREA?.trim();

  return {
    apiKey,
    area: areaValue ? parseAreaBounds(areaValue) : DEFAULT_AREA,
  };
}

export function parseAreaBounds(value: string): AreaBounds {
  const parts = value.split(",").map((part) => part.trim());

  if (parts.length !== 4 || parts.some((part) => part === "")) {
    throw new FirmsProviderError("invalid_area_configuration");
  }

  const values = parts.map(Number);

  if (values.some((number) => !Number.isFinite(number))) {
    throw new FirmsProviderError("invalid_area_configuration");
  }

  const [west, south, east, north] = values;
  const bounds = { west, south, east, north };

  if (
    west < -180 ||
    west > 180 ||
    east < -180 ||
    east > 180 ||
    south < -90 ||
    south > 90 ||
    north < -90 ||
    north > 90 ||
    west >= east ||
    south >= north
  ) {
    throw new FirmsProviderError("invalid_area_configuration");
  }

  return bounds;
}

export async function fetchRecentHotspots(
  apiKey: string,
  area: AreaBounds,
  fetchImplementation: typeof fetch = fetch,
): Promise<FirmsSourceBatch> {
  const responses = await Promise.all(
    FIRMS_INGEST_SOURCES.map(async (source) => {
      try {
        const csv = await fetchSourceCsv(
          apiKey,
          source,
          area,
          fetchImplementation,
        );
        return {
          source,
          hotspots: parseSourceCsv(csv, source),
          errorCode: null,
        };
      } catch (error) {
        return {
          source,
          hotspots: [],
          errorCode:
            error instanceof FirmsProviderError
              ? error.code
              : "provider_request_failed",
        };
      }
    }),
  );

  return {
    hotspots: responses.flatMap(({ hotspots }) => hotspots),
    successfulSources: responses
      .filter(({ errorCode }) => errorCode === null)
      .map(({ source }) => source),
    failedSources: responses
      .filter((response) => response.errorCode !== null)
      .map(({ source, errorCode }) => ({
        source,
        errorCode: errorCode as string,
      })),
  };
}

export type FirmsSourceBatch = {
  hotspots: FirmsHotspot[];
  successfulSources: FirmsIngestSource[];
  failedSources: Array<{
    source: FirmsIngestSource;
    errorCode: string;
  }>;
};

function parseSourceCsv(csv: string, source: FirmsIngestSource) {
  try {
    return parseFirmsCsv(csv, source);
  } catch (error) {
    if (error instanceof FirmsDataError) {
      throw new FirmsProviderError(error.code);
    }

    throw error;
  }
}

function buildAreaUrl(
  apiKey: string,
  source: FirmsIngestSource,
  area: AreaBounds,
): string {
  const coordinates = [area.west, area.south, area.east, area.north].join(",");

  return `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(apiKey)}/${source}/${coordinates}/${DAY_RANGE}`;
}

async function fetchSourceCsv(
  apiKey: string,
  source: FirmsIngestSource,
  area: AreaBounds,
  fetchImplementation: typeof fetch,
): Promise<string> {
  let response: Response;

  try {
    response = await fetchImplementation(buildAreaUrl(apiKey, source, area), {
      headers: { Accept: "text/csv" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new FirmsProviderError("provider_request_failed");
  }

  const contentLength = Number(response.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new FirmsProviderError("response_too_large");
  }

  if (!response.ok) {
    throw new FirmsProviderError("provider_http_error");
  }

  return readCsvBody(response);
}

async function readCsvBody(response: Response): Promise<string> {
  const reader = response.body?.getReader();

  if (!reader) {
    return "";
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new FirmsProviderError("response_too_large");
      }

      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof FirmsProviderError) {
      throw error;
    }

    throw new FirmsProviderError("provider_response_unreadable");
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new FirmsProviderError("provider_response_unreadable");
  }
}
