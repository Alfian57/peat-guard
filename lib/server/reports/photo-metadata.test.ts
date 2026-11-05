import { describe, expect, test } from "bun:test";
import { reportPhotoMetadata } from "./photo-metadata";

describe("report photo metadata", () => {
  test("omits the private photo route when a report has no stored image", () => {
    expect(
      reportPhotoMetadata("61000000-0000-4000-8000-000000000001", ""),
    ).toEqual({ hasPhoto: false, photoHref: null });
  });

  test("returns only the private photo route for stored evidence", () => {
    expect(
      reportPhotoMetadata(
        "61000000-0000-4000-8000-000000000001",
        "reports/61000000-0000-4000-8000-000000000001.webp",
      ),
    ).toEqual({
      hasPhoto: true,
      photoHref: "/api/reports/61000000-0000-4000-8000-000000000001/photo",
    });
  });
});
