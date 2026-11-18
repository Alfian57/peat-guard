import { afterEach, expect, mock, test } from "bun:test";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { NewFieldReport } from "@/lib/client/offline/types";

const NativeDate = globalThis.Date;
const originalFetch = globalThis.fetch;
const originalGeolocation = Object.getOwnPropertyDescriptor(
  navigator,
  "geolocation",
);

mock.module("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

const compressFile = async (file: File) => ({
  blob: new Blob(["normalized photo"], { type: "image/webp" }),
  fileName: `${file.name}.webp`,
});
let compressPhoto = compressFile;
mock.module("@/lib/client/offline/compress-photo", () => ({
  compressPhoto: (file: File) => compressPhoto(file),
}));

const { FieldReportForm } =
  await import("@/components/field/field-report-form");

afterEach(() => {
  globalThis.fetch = originalFetch;
  compressPhoto = compressFile;
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
  await user.clear(screen.getByLabelText(/Lintang/));
  await user.type(screen.getByLabelText(/Lintang/), "-2.3194");
  await user.upload(
    screen.getByLabelText("Ambil foto"),
    new File(["camera photo"], "patrol.jpg", { type: "image/jpeg" }),
  );
  currentTime += 5 * 60 * 1000;
  await user.click(screen.getByRole("button", { name: "Simpan laporan" }));

  await waitFor(() => expect(savedReports).toHaveLength(1));
  expect(savedReports[0]?.capturedAt).toBe(photoSelectedAt);
  expect(savedReports[0]?.accuracyMeters).toBe(null);
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

test("offline form uses camera or gallery without demo samples or online map chunks and preserves AI consent", async () => {
  const user = userEvent.setup();
  const saved: NewFieldReport[] = [];
  render(
    <FieldReportForm
      isConnected={false}
      canUseDemoSamples
      onSave={async (report) => {
        saved.push(report);
      }}
      submitLabel="Simpan laporan"
    />,
  );
  expect(screen.queryByText("Coba dengan sampel demo") === null).toBe(true);
  expect(screen.getByText("Peta tersedia saat terhubung")).toBeTruthy();
  expect(screen.queryByText("Tentukan titik laporan di peta") === null).toBe(
    true,
  );
  expect(screen.queryByRole("button", { name: /Sampel demo/ }) === null).toBe(
    true,
  );
  await user.upload(
    screen.getByLabelText("Galeri"),
    new File(["camera photo"], "patrol.jpg", { type: "image/jpeg" }),
  );
  await user.type(screen.getByLabelText(/Lintang/), "-2.3194");
  await user.type(screen.getByLabelText(/Bujur/), "113.9102");
  await user.click(
    screen.getByRole("checkbox", { name: /Izinkan analisis foto/ }),
  );
  await user.click(screen.getByRole("button", { name: "Simpan laporan" }));
  await waitFor(() => expect(saved).toHaveLength(1));
  expect(saved[0]?.isDemoSample).toBe(false);
  expect(saved[0]?.aiConsent).toBe(true);
  expect(saved[0]?.latitude).toBe(-2.3194);
  expect(saved[0]?.accuracyMeters).toBe(null);
});

test("preserves the photo and entered values when saving fails, then permits retry", async () => {
  const user = userEvent.setup();
  let attempts = 0;
  const saved: NewFieldReport[] = [];
  render(
    <FieldReportForm
      onSave={async (report) => {
        attempts += 1;
        if (attempts === 1) throw new Error("Penyimpanan belum tersedia.");
        saved.push(report);
      }}
      submitLabel="Simpan laporan"
    />,
  );
  await user.upload(
    screen.getByLabelText("Galeri"),
    new File(["photo"], "canal.jpg", { type: "image/jpeg" }),
  );
  fireEvent.change(screen.getByLabelText(/Lintang/), {
    target: { value: "-2.3194" },
  });
  fireEvent.change(screen.getByLabelText(/Bujur/), {
    target: { value: "113.9102" },
  });
  fireEvent.change(screen.getByLabelText(/Keterangan tambahan/), {
    target: { value: "Kanal perlu diperiksa." },
  });
  await user.click(screen.getByRole("button", { name: "Kanal", exact: true }));
  await user.click(screen.getByRole("button", { name: "Simpan laporan" }));
  expect((await screen.findByRole("alert")).textContent).toBe(
    "Penyimpanan belum tersedia.",
  );
  expect(screen.getByLabelText(/Keterangan tambahan/)).toHaveProperty(
    "value",
    "Kanal perlu diperiksa.",
  );
  expect(screen.getByLabelText(/Lintang/)).toHaveProperty("value", "-2.3194");
  await user.click(screen.getByRole("button", { name: "Simpan laporan" }));
  await waitFor(() => expect(saved).toHaveLength(1));
  expect(saved[0]?.tags).toEqual(["Kanal"]);
  expect(saved[0]?.photo.size).toBeGreaterThan(0);
});

test("keeps coordinates typed after a manual GPS request starts", async () => {
  const callbacks: PositionCallback[] = [];
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (callback: PositionCallback) =>
        callbacks.push(callback),
    },
  });
  const user = userEvent.setup();
  render(
    <FieldReportForm
      onSave={async () => undefined}
      submitLabel="Simpan laporan"
    />,
  );
  await user.click(screen.getByRole("button", { name: "Ambil GPS" }));
  await user.type(screen.getByLabelText(/Lintang/), "-2.5");
  await user.type(screen.getByLabelText(/Bujur/), "113.9");
  expect(callbacks).toHaveLength(2);

  await act(async () => {
    const position = {
      coords: {
        latitude: -6.2,
        longitude: 106.8,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 1,
    } as GeolocationPosition;
    callbacks[1](position);
    callbacks[0](position);
  });
  expect(screen.getByLabelText(/Lintang/)).toHaveProperty("value", "-2.5");
  expect(screen.getByLabelText(/Bujur/)).toHaveProperty("value", "113.9");
});

test("submits the latest selected photo even if earlier compression finishes last", async () => {
  const first =
    Promise.withResolvers<Awaited<ReturnType<typeof compressFile>>>();
  compressPhoto = (file) =>
    file.name === "old.jpg" ? first.promise : compressFile(file);
  const user = userEvent.setup();
  const save = mock(async () => undefined);
  render(
    <FieldReportForm
      isConnected={false}
      onSave={save}
      submitLabel="Simpan laporan"
    />,
  );
  await user.type(screen.getByLabelText(/Lintang/), "-2.5");
  await user.type(screen.getByLabelText(/Bujur/), "113.9");
  const gallery = screen.getByLabelText("Galeri");
  await user.upload(
    gallery,
    new File(["old"], "old.jpg", { type: "image/jpeg" }),
  );
  expect(screen.getByRole("button", { name: "Simpan laporan" })).toHaveProperty(
    "disabled",
    true,
  );
  await user.upload(
    gallery,
    new File(["new"], "new.jpg", { type: "image/jpeg" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Simpan laporan" }),
    ).toHaveProperty("disabled", false),
  );
  await act(async () =>
    first.resolve(await compressFile(new File(["old"], "old.jpg"))),
  );
  await user.click(screen.getByRole("button", { name: "Simpan laporan" }));
  expect(save.mock.calls[0]?.[0].photoName).toBe("new.jpg.webp");
});

test("offers only the formats supported by the offline photo form", () => {
  render(
    <FieldReportForm
      isConnected={false}
      onSave={async () => undefined}
      submitLabel="Simpan laporan"
    />,
  );
  for (const label of ["Ambil foto", "Galeri"]) {
    expect(screen.getByLabelText(label)).toHaveProperty(
      "accept",
      "image/jpeg,image/png,image/webp",
    );
  }
});
