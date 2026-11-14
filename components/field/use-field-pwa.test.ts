import { afterEach, expect, mock, test } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import { PwaInstallProvider } from "@/components/pwa/pwa-install-provider";
import { useFieldPwa } from "./use-field-pwa";

const originalWorker = Object.getOwnPropertyDescriptor(
  navigator,
  "serviceWorker",
);
afterEach(() => {
  if (originalWorker)
    Object.defineProperty(navigator, "serviceWorker", originalWorker);
  else Reflect.deleteProperty(navigator, "serviceWorker");
});

test("install prompt is invoked by the volunteer and clears after the browser handles it", async () => {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { getRegistrations: async () => [] },
  });
  const { result } = renderHook(useFieldPwa, { wrapper: PwaInstallProvider });
  const prompt = mock(async () => undefined);
  const event = Object.assign(
    new Event("beforeinstallprompt", { cancelable: true }),
    { prompt, userChoice: Promise.resolve({ outcome: "accepted" }) },
  );
  await act(async () => {
    window.dispatchEvent(event);
  });
  expect(event.defaultPrevented).toBe(true);
  expect(result.current.canInstall).toBe(true);
  expect(prompt).toHaveBeenCalledTimes(0);
  await act(async () => {
    await result.current.install();
  });
  expect(prompt).toHaveBeenCalledTimes(1);
  expect(result.current.canInstall).toBe(false);
  await act(async () => {
    window.dispatchEvent(new Event("appinstalled"));
  });
  expect(result.current.installed).toBe(true);
  await waitFor(() => expect(result.current.status).toBe("development"));
});

test("a failed native install prompt is consumed and exposes browser instructions", async () => {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { getRegistrations: async () => [] },
  });
  const { result } = renderHook(useFieldPwa, { wrapper: PwaInstallProvider });
  const event = Object.assign(
    new Event("beforeinstallprompt", { cancelable: true }),
    {
      prompt: async () => {
        throw new Error("Install unavailable");
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    },
  );
  await act(async () => {
    window.dispatchEvent(event);
  });
  await act(async () => {
    await result.current.install();
  });
  expect(result.current.error).toContain("Pemasangan belum dapat dibuka");
  expect(result.current.canInstall).toBe(false);
  expect(result.current.isInstalling).toBe(false);
});
