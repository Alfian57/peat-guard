import { describe, expect, test } from "bun:test";

import { FirmsDataError, parseFirmsCsv } from "@/lib/server/firms/csv";

const csv = [
  "latitude,longitude,bright_ti4,acq_date,acq_time,satellite,instrument,confidence,version",
  "-2.001,113.904,315.4,2026-11-15,924,N,VIIRS,n,2.0NRT",
].join("\n");

describe("parseFirmsCsv", () => {
  test("parses UTC acquisition times and normalizes confidence", () => {
    const [hotspot] = parseFirmsCsv(csv, "VIIRS_SNPP_NRT");

    expect(hotspot).toMatchObject({
      source: "VIIRS_SNPP_NRT",
      latitude: -2.001,
      longitude: 113.904,
      brightnessKelvin: 315.4,
      confidence: "nominal",
    });
    expect(hotspot.acquiredAt.toISOString()).toBe("2026-11-15T09:24:00.000Z");
  });

  test("uses a stable external id to deduplicate repeated provider rows", () => {
    const first = parseFirmsCsv(csv, "VIIRS_SNPP_NRT");
    const repeated = parseFirmsCsv(csv, "VIIRS_SNPP_NRT");

    expect(first).toHaveLength(1);
    expect(first[0].externalId).toBe(repeated[0].externalId);
  });

  test("rejects coordinates outside geographic bounds", () => {
    const invalidCsv = csv.replace("-2.001,113.904", "-91,113.904");

    expect(() => parseFirmsCsv(invalidCsv, "VIIRS_SNPP_NRT")).toThrow(
      new FirmsDataError("invalid_coordinates"),
    );
  });

  test("rejects impossible acquisition times", () => {
    const invalidCsv = csv.replace(",924,", ",2460,");

    expect(() => parseFirmsCsv(invalidCsv, "VIIRS_SNPP_NRT")).toThrow(
      new FirmsDataError("invalid_acquisition_time"),
    );
  });

  test("accepts an empty result only when a valid header is present", () => {
    expect(parseFirmsCsv(csv.split("\n")[0], "VIIRS_SNPP_NRT")).toEqual([]);
    expect(() => parseFirmsCsv("no data", "VIIRS_SNPP_NRT")).toThrow(
      new FirmsDataError("missing_required_columns"),
    );
  });
});
