import { expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldPwaPanel } from "./field-pwa-panel";
import type { FieldPwaState } from "./use-field-pwa";

function pwaState(overrides: Partial<FieldPwaState> = {}): FieldPwaState {
  return {
    status: "ready",
    installed: false,
    ios: false,
    canInstall: true,
    isInstalling: false,
    install: async () => true,
    update: () => undefined,
    updateAvailable: false,
    error: null,
    ...overrides,
  };
}

test("offers installation when the browser provides it and hides it for installed apps", async () => {
  const user = userEvent.setup();
  const install = mock(async () => true);
  const { rerender } = render(<FieldPwaPanel pwa={pwaState({ install })} />);
  expect(screen.getByRole("status").textContent).toContain(
    "siap dibuka offline",
  );
  await user.click(screen.getByRole("button", { name: "Pasang aplikasi" }));
  expect(install).toHaveBeenCalledTimes(1);
  rerender(<FieldPwaPanel pwa={pwaState({ installed: true })} />);
  expect(
    screen.queryByRole("button", { name: "Pasang aplikasi" }) === null,
  ).toBe(true);
  expect(screen.getByText("PEATGUARD terpasang")).toBeTruthy();
});

test("provides Safari instructions and keeps incomplete offline setup explicit", () => {
  render(
    <FieldPwaPanel
      pwa={pwaState({ canInstall: false, ios: true, status: "unavailable" })}
    />,
  );
  expect(screen.getByText(/Di Safari, buka Bagikan/)).toBeTruthy();
  expect(screen.getByRole("status").textContent).toContain("belum lengkap");
  expect(
    screen.queryByRole("button", { name: "Pasang aplikasi" }) === null,
  ).toBe(true);
});

test("offers an explicit update after reminding the volunteer to save the draft", async () => {
  const user = userEvent.setup();
  const update = mock(() => undefined);
  render(<FieldPwaPanel pwa={pwaState({ updateAvailable: true, update })} />);
  expect(screen.getByText(/Simpan draf sebelum memuat ulang/)).toBeTruthy();
  expect(update).toHaveBeenCalledTimes(0);
  await user.click(screen.getByRole("button", { name: "Perbarui aplikasi" }));
  expect(update).toHaveBeenCalledTimes(1);
});
