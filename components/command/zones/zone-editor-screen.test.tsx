import { afterEach, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const router = { replace: mock(() => undefined) };
mock.module("next/navigation", () => ({ useRouter: () => router }));

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
});

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
