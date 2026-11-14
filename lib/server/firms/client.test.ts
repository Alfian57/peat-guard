import { describe, expect, test } from "bun:test";

import {
  fetchRecentHotspots,
  parseAreaBounds,
} from "@/lib/server/firms/client";
import { FirmsProviderError } from "@/lib/server/firms/errors";

const csvHeader =
  "latitude,longitude,acq_date,acq_time,bright_ti4,confidence,satellite,instrument,version\n";
const area = { west: 109, south: -5, east: 117, north: 2 };

describe("NASA FIRMS client", () => {
  test("rejects empty area-bound segments instead of treating them as zero", () => {
    let error: unknown;
    try {
      parseAreaBounds("109,,117,2");
    } catch (cause) {
      error = cause;
    }
    expect(error).toBeInstanceOf(FirmsProviderError);
    expect(error).toMatchObject({ code: "invalid_area_configuration" });
    expect(parseAreaBounds("109, -5, 117, 2")).toEqual(area);
  });

  test("requests a two-day window and retains a healthy source when another fails", async () => {
    const requestedUrls: string[] = [];
    const batch = await fetchRecentHotspots("test-key", area, async (input) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes("VIIRS_NOAA20_NRT")) {
        return new Response("unavailable", { status: 503 });
      }
      return new Response(csvHeader, { status: 200 });
    });

    expect(requestedUrls).toHaveLength(2);
    expect(requestedUrls.every((url) => url.endsWith("/2"))).toBe(true);
    expect(requestedUrls.some((url) => url.includes("VIIRS_SNPP_NRT"))).toBe(
      false,
    );
    expect(batch).toEqual({
      hotspots: [],
      successfulSources: ["VIIRS_NOAA21_NRT"],
      failedSources: [
        { source: "VIIRS_NOAA20_NRT", errorCode: "provider_http_error" },
      ],
    });
  });
});
