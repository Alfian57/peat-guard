import { afterEach, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { API_ROUTES, APP_ROUTES } from "@/lib/routes";

const router = { replace: mock(() => undefined), push: mock(() => undefined) };
mock.module("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/command/zones",
}));

const originalFetch = globalThis.fetch;
const zoneId = "6a57d28f-d424-4e4c-90c4-66208b10b755";
const polygon = {
  type: "Polygon",
  coordinates: [
    [
      [114, -1],
      [114.1, -1],
      [114.1, -1.1],
      [114, -1],
    ],
  ],
};
const approvedZone = {
  id: zoneId,
  slug: "zona-utara",
  name: "Zona Utara",
  villageName: "Desa Utara",
  peatDepthMeters: 1.5,
  areaHectares: 20,
  carbonFactor: 45,
  emissionFactor: 2.75,
  incentivePerTonIdr: 100000,
  isApproved: true,
  isDemoData: false,
  geometry: polygon,
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  router.push.mockClear();
});

let clickMap: ((point: [number, number]) => void) | undefined;
mock.module("@/components/command/zones/zone-map-panel", () => ({
  ZoneMapPanel: ({ onMapClick }: { onMapClick: typeof clickMap }) => {
    clickMap = onMapClick;
    return null;
  },
}));

const { ZoneEditorScreen } =
  await import("@/components/command/zones/zone-editor-screen");

test("warns before an approved boundary change and has no approval control", async () => {
  const user = userEvent.setup();
  let patchPayload: unknown;
  globalThis.fetch = mock(async (input, init) => {
    if (String(input) === "/api/command/map") {
      return Response.json({
        zones: [approvedZone],
        waterPoints: [],
        hotspots: [],
      });
    }

    if (init?.method === "PATCH") {
      patchPayload = JSON.parse(String(init.body));
      return Response.json({
        zone: { ...approvedZone, peatDepthMeters: 2, isApproved: false },
      });
    }

    return Response.json({ zone: approvedZone });
  }) as typeof fetch;

  render(<ZoneEditorScreen zoneId={zoneId} />);

  expect(
    await screen.findByText(/Zona ini sudah disetujui Verifikator/),
  ).toBeTruthy();
  expect(screen.queryByLabelText(/persetujuan/i)).toBeNull();

  await user.clear(screen.getByLabelText(/Kedalaman gambut/));
  await user.type(screen.getByLabelText(/Kedalaman gambut/), "2");
  fireEvent.submit(
    screen.getByRole("button", { name: "Simpan perubahan" }).closest("form")!,
  );

  expect(await screen.findByRole("alertdialog")).toBeTruthy();
  expect(screen.getByText(/akan mencabut status persetujuan/)).toBeTruthy();
  await user.click(
    screen.getByRole("button", { name: "Simpan dan cabut persetujuan" }),
  );

  expect(
    await screen.findByText(/Persetujuan zona dicabut otomatis/),
  ).toBeTruthy();
  expect(patchPayload).toEqual({ peatDepthMeters: 2 });
});

test("opens boundary coordinates for editing and clears the selected vertex on reset", async () => {
  const user = userEvent.setup();
  globalThis.fetch = mock(async (input) =>
    Response.json(
      String(input) === API_ROUTES.command.map
        ? { zones: [approvedZone], waterPoints: [], hotspots: [] }
        : { zone: approvedZone },
    ),
  ) as typeof fetch;

  render(<ZoneEditorScreen zoneId={zoneId} />);
  const disclosure = await screen.findByText("Koordinat titik batas");
  expect(disclosure.closest("details")?.open).toBe(false);
  await user.click(disclosure);
  expect(disclosure.closest("details")?.open).toBe(true);
  await user.click(screen.getByRole("button", { name: /^Titik 2 / }));
  expect(screen.getByText(/memindahkan titik 2/).getAttribute("role")).toBe(
    "status",
  );
  await user.click(screen.getByRole("button", { name: "Reset batas" }));
  expect(screen.queryByText("Koordinat titik batas")).toBeNull();
  expect(screen.queryByText(/memindahkan titik 2/)).toBeNull();
  expect(screen.getByText("0/3 titik minimum")).toBeTruthy();
});

test("preserves create values when the boundary is missing and can cancel to the zone list", async () => {
  const user = userEvent.setup();
  let saveRequests = 0;
  globalThis.fetch = mock(async (_input, init) => {
    if (init?.method === "POST") saveRequests += 1;
    return Response.json({ zones: [], waterPoints: [], hotspots: [] });
  }) as typeof fetch;

  render(<ZoneEditorScreen />);
  await user.type(screen.getByLabelText(/Nama zona/), "Zona Selatan");
  // Happy DOM incorrectly treats 1.5 as a step mismatch for step="0.01".
  fireEvent.submit(screen.getByRole("form", { name: "Informasi zona" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "sedikitnya tiga titik",
  );
  expect((screen.getByLabelText(/Nama zona/) as HTMLInputElement).value).toBe(
    "Zona Selatan",
  );
  expect(saveRequests).toBe(0);
  await user.click(screen.getByRole("button", { name: "Batal" }));
  expect(router.push).toHaveBeenCalledWith(APP_ROUTES.command.zones);
});

test("preserves zone input when saving fails", async () => {
  const user = userEvent.setup();
  globalThis.fetch = mock(async (input, init) => {
    if (init?.method === "PATCH") {
      return Response.json(
        { error: "Zona belum dapat disimpan." },
        { status: 503 },
      );
    }
    return Response.json(
      String(input) === API_ROUTES.command.map
        ? { zones: [approvedZone], waterPoints: [], hotspots: [] }
        : { zone: approvedZone },
    );
  }) as typeof fetch;

  render(<ZoneEditorScreen zoneId={zoneId} />);
  const nameField = await screen.findByRole("textbox", { name: /Nama zona/ });
  await user.clear(nameField);
  await user.type(nameField, "Zona Utara Baru");
  fireEvent.submit(screen.getByRole("form", { name: "Informasi zona" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Zona belum dapat disimpan.",
  );
  expect((nameField as HTMLInputElement).value).toBe("Zona Utara Baru");
  expect(
    (
      screen.getByRole("button", {
        name: "Simpan perubahan",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});

test("retains the first two drawing clicks and undoes points before a polygon exists", async () => {
  globalThis.fetch = mock(async () =>
    Response.json({ zones: [], waterPoints: [], hotspots: [] }),
  ) as typeof fetch;
  render(<ZoneEditorScreen />);
  fireEvent.click(screen.getByRole("button", { name: "Gambar batas" }));

  await act(async () => clickMap?.([114, -2]));
  await act(async () => clickMap?.([114.1, -2]));
  expect(screen.getByText("2/3 titik minimum")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Batalkan titik terakhir" }),
  );
  expect(screen.getByText("1/3 titik minimum")).toBeTruthy();
  await act(async () => clickMap?.([114.1, -2]));
  await act(async () => clickMap?.([114.1, -2.1]));
  expect(screen.getByText("3 titik · batas tertutup")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Reset batas" }));
  expect(screen.getByText("0/3 titik minimum")).toBeTruthy();
});
