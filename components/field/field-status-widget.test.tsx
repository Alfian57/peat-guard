import { expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FieldStatusWidget } from "./field-status-widget";

test("sidebar offline simulation toggles by keyboard and exposes its current state", async () => {
  const user = userEvent.setup();
  const toggle = mock(() => undefined);
  const syncNow = mock(async () => undefined);
  const { rerender } = render(
    <FieldStatusWidget
      isConnected
      isSyncing={false}
      ownerStatus="authenticated"
      queueCount={1}
      simulatedOffline={false}
      syncNow={syncNow}
      toggleSimulatedOffline={toggle}
    />,
  );

  const control = screen.getByRole("button", {
    name: "Simulasikan mode offline",
  });
  expect(control.getAttribute("aria-pressed")).toBe("false");
  await user.tab();
  expect(document.activeElement === control).toBe(true);
  await user.keyboard(" ");
  expect(toggle).toHaveBeenCalledTimes(1);
  expect(syncNow).toHaveBeenCalledTimes(0);

  rerender(
    <FieldStatusWidget
      isConnected={false}
      isSyncing={false}
      ownerStatus="offline-known"
      queueCount={1}
      simulatedOffline
      syncNow={syncNow}
      toggleSimulatedOffline={toggle}
    />,
  );
  expect(control.getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("Mode offline")).toBeTruthy();
  expect(
    screen
      .getByRole("button", { name: "Kirim ke posko" })
      .hasAttribute("disabled"),
  ).toBe(true);
  await user.click(control);
  expect(toggle).toHaveBeenCalledTimes(2);
});
