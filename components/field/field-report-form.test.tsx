import { afterEach, expect, mock, test } from "bun:test";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { NewFieldReport } from "@/lib/client/offline/types";

const NativeDate = globalThis.Date;
const originalGeolocation = Object.getOwnPropertyDescriptor(
  navigator,
  "geolocation",
);

mock.module("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

mock.module("@/lib/client/offline/compress-photo", () => ({
  compressPhoto: async (file: File) => ({
    blob: new Blob(["normalized photo"], { type: "image/webp" }),
    fileName: `${file.name}.webp`,
  }),
}));

const { FieldReportForm } =
  await import("@/components/field/field-report-form");

afterEach(() => {
  Object.defineProperty(globalThis, "Date", {
    value: NativeDate,
    configurable: true,
    writable: true,
  });
  if (originalGeolocation) {
    Object.defineProperty(navigator, "geolocation", originalGeolocation);
  } else {
    Reflect.deleteProperty(navigator, "geolocation");
  }
});

test("requests GPS on a new form and saves the photo selection time", async () => {
  let currentTime = NativeDate.parse("2026-11-16T01:00:00.000Z");
  class ControlledDate extends NativeDate {
    constructor(value?: string | number | NativeDate) {
      if (value === undefined) {
        super(currentTime);
      } else if (value instanceof NativeDate) {
        super(value.getTime());
      } else {
        super(value);
      }
    }

    static override now() {
      return currentTime;
    }
  }
  Object.defineProperty(globalThis, "Date", {
    value: ControlledDate,
    configurable: true,
    writable: true,
  });

  const getCurrentPosition: Geolocation["getCurrentPosition"] = (success) => {
    queueMicrotask(() =>
      success({
        coords: {
          latitude: -2.3194,
          longitude: 113.9102,
          accuracy: 8,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: currentTime,
      } as GeolocationPosition),
    );
  };
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });

  const savedReports: NewFieldReport[] = [];
  const user = userEvent.setup();
  render(
    <FieldReportForm
      onSave={async (report) => {
        savedReports.push(report);
      }}
      submitLabel="Simpan laporan"
    />,
  );

  await waitFor(() =>
    expect(screen.getByLabelText(/Lintang/)).toHaveProperty(
      "value",
      "-2.319400",
    ),
  );
  expect(screen.getByLabelText(/Bujur/)).toHaveProperty("value", "113.910200");

  const photoSelectedAt = new NativeDate(currentTime).toISOString();
  await user.upload(
    screen.getByLabelText("Ambil foto"),
    new File(["camera photo"], "patrol.jpg", { type: "image/jpeg" }),
  );
  currentTime += 5 * 60 * 1000;
  await user.click(screen.getByRole("button", { name: "Simpan laporan" }));

  await waitFor(() => expect(savedReports).toHaveLength(1));
  expect(savedReports[0]?.capturedAt).toBe(photoSelectedAt);
});

test("keeps manual coordinates available when automatic GPS permission is denied", async () => {
  const getCurrentPosition: Geolocation["getCurrentPosition"] = (
    _success,
    error,
  ) => {
    queueMicrotask(() =>
      error?.({
        code: 1,
        message: "Permission denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }),
    );
  };
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });

  render(
    <FieldReportForm
      onSave={async () => undefined}
      submitLabel="Simpan laporan"
    />,
  );

  expect(
    await screen.findByText(
      "Izin lokasi ditolak. Masukkan koordinat secara manual jika mengetahui lokasinya.",
    ),
  ).toBeTruthy();
  expect(screen.getByLabelText(/Lintang/)).toBeTruthy();
  expect(screen.getByLabelText(/Bujur/)).toBeTruthy();
});

test("preserves manual coordinates if automatic GPS resolves after the volunteer edits them", async () => {
  let finishLocationRequest: PositionCallback | undefined;
  const getCurrentPosition: Geolocation["getCurrentPosition"] = (success) => {
    finishLocationRequest = success;
  };
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });

  const user = userEvent.setup();
  render(
    <FieldReportForm
      onSave={async () => undefined}
      submitLabel="Simpan laporan"
    />,
  );
  await waitFor(() => expect(finishLocationRequest).toBeTruthy());

  await user.type(screen.getByLabelText(/Lintang/), "-2.500000");
  await user.type(screen.getByLabelText(/Bujur/), "113.750000");

  await act(async () => {
    finishLocationRequest?.({
      coords: {
        latitude: -1.1,
        longitude: 110.2,
        accuracy: 15,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 1,
    } as GeolocationPosition);
  });

  expect(screen.getByLabelText(/Lintang/)).toHaveProperty("value", "-2.500000");
  expect(screen.getByLabelText(/Bujur/)).toHaveProperty("value", "113.750000");
  expect(screen.getByText("Koordinat manual dipertahankan.")).toBeTruthy();
});
