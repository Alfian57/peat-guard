import { afterEach, expect, mock, test } from "bun:test";
import { configureFieldServiceWorker } from "./service-worker";
import { APP_ROUTES } from "@/lib/routes";

const originalWorker = Object.getOwnPropertyDescriptor(
  navigator,
  "serviceWorker",
);
const originalCaches = Object.getOwnPropertyDescriptor(window, "caches");
const originalSecure = Object.getOwnPropertyDescriptor(
  window,
  "isSecureContext",
);

afterEach(() => {
  for (const [target, property, descriptor] of [
    [navigator, "serviceWorker", originalWorker],
    [window, "caches", originalCaches],
    [window, "isSecureContext", originalSecure],
  ] as const) {
    if (descriptor) Object.defineProperty(target, property, descriptor);
    else Reflect.deleteProperty(target, property);
  }
});

test("development unregisters only PEATGUARD workers and clears their old mutable asset caches", async () => {
  const ownUnregister = mock(async () => true);
  const otherUnregister = mock(async () => true);
  const register = mock(async () => undefined);
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      register,
      getRegistrations: async () => [
        {
          active: {
            scriptURL: `${window.location.origin}${APP_ROUTES.pwa.worker}`,
          },
          unregister: ownUnregister,
        },
        {
          active: { scriptURL: `${window.location.origin}/other-worker.js` },
          unregister: otherUnregister,
        },
      ],
    },
  });
  const remove = mock(async () => true);
  Object.defineProperty(window, "caches", {
    configurable: true,
    value: {
      keys: async () => [
        "peatguard-field-v4",
        "peatguard-field-v5",
        "another-app",
      ],
      delete: remove,
    },
  });
  expect(await configureFieldServiceWorker(false)).toBe(null);
  expect(ownUnregister).toHaveBeenCalledTimes(1);
  expect(otherUnregister).toHaveBeenCalledTimes(0);
  expect(register).toHaveBeenCalledTimes(0);
  expect(remove.mock.calls.map(([name]) => name)).toEqual([
    "peatguard-field-v4",
    "peatguard-field-v5",
  ]);
});

test("production registers the root-scoped worker without the HTTP script cache", async () => {
  const registration = { scope: window.location.origin };
  const register = mock(async (path: string, options: RegistrationOptions) => {
    expect(path).toBe(APP_ROUTES.pwa.worker);
    expect(options.updateViaCache).toBe("none");
    return registration;
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: true,
  });
  expect(await configureFieldServiceWorker(true)).toBe(registration);
  expect(register).toHaveBeenCalledWith(APP_ROUTES.pwa.worker, {
    scope: APP_ROUTES.home,
    updateViaCache: "none",
  });
});

test("an insecure production origin cannot claim offline setup succeeded", async () => {
  const register = mock(async () => undefined);
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: false,
  });
  await expect(configureFieldServiceWorker(true)).rejects.toThrow("HTTPS");
  expect(register).toHaveBeenCalledTimes(0);
});
