import { expect, mock, test } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldConnectionPanel } from "./field-connection-panel";

test("discloses connection controls and allows retrying a queued sync", async () => {
  const user = userEvent.setup();
  const syncNow = mock(async () => undefined);
  const toggle = mock(() => undefined);
  render(
    <FieldConnectionPanel
      isConnected
      isSyncing={false}
      ownerStatus="authenticated"
      queueCount={2}
      simulatedOffline={false}
      syncNow={syncNow}
      toggleSimulatedOffline={toggle}
    />,
  );
  const summary = screen.getByText("Terhubung ke posko").closest("summary")!;
  expect(summary.closest("details")?.open).toBe(false);
  expect(
    summary
      .closest("details")
      ?.contains(screen.getByRole("button", { name: "Kirim ke posko" })),
  ).toBe(true);
  await user.click(summary);
  expect(summary.closest("details")?.open).toBe(true);
  await user.click(screen.getByRole("button", { name: "Kirim ke posko" }));
  await waitFor(() => expect(syncNow).toHaveBeenCalledTimes(1));
  await user.click(
    screen.getByRole("button", { name: "Simulasikan mode offline" }),
  );
  expect(toggle).toHaveBeenCalledTimes(1);
});

test("offline controls keep the known-owner status and prevent a network sync", async () => {
  const user = userEvent.setup();
  render(
    <FieldConnectionPanel
      isConnected={false}
      isSyncing={false}
      ownerStatus="offline-known"
      queueCount={1}
      simulatedOffline
      syncNow={async () => undefined}
      toggleSimulatedOffline={() => undefined}
    />,
  );
  await user.click(screen.getByText("Offline · draf aman di perangkat"));
  expect(
    (
      screen.getByRole("button", {
        name: "Kirim ke posko",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(
    screen
      .getByRole("button", { name: "Simulasikan mode offline" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});
