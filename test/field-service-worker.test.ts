import { expect, test } from "bun:test";
import { createContext, runInContext } from "node:vm";

const workerSource = await Bun.file(
  new URL("../public/sw.js", import.meta.url),
).text();
const origin = "https://peatguard.test";
const cacheName = "peatguard-field-v7";
const shellPaths = [
  "/field/home",
  "/field/reports/create",
  "/field/queue",
  "/field/report",
];

function resourceRequest(path: string): Request {
  const request = new Request(new URL(path, origin));
  // Bun 1.3 exposes navigate even when RequestInit.mode is cors.
  Object.defineProperty(request, "mode", { value: "cors" });
  return request;
}

function networkResponse(
  path: string,
  body: string,
  headers: HeadersInit = {},
  status = 200,
  redirected = false,
): Response {
  const decorate = (response: Response): Response => {
    Object.defineProperty(response, "url", {
      value: new URL(path, origin).href,
    });
    Object.defineProperty(response, "redirected", { value: redirected });
    const originalClone = response.clone.bind(response);
    response.clone = () => decorate(originalClone());
    return response;
  };
  return decorate(new Response(body, { headers, status }));
}

type WorkerEvent = {
  request?: Request;
  data?: { type: string };
  source?: { postMessage: (value: unknown) => void };
  waitUntil: (promise: Promise<unknown>) => void;
  respondWith: (promise: Promise<Response>) => void;
};

function workerHarness() {
  const cacheData = new Map<string, Map<string, Response>>();
  const handlers = new Map<string, (event: WorkerEvent) => void>();
  const fetches: string[] = [];
  let skipped = false;
  let fetchResponse = (url: string): Response => {
    const path = new URL(url).pathname;
    if (shellPaths.includes(path))
      return networkResponse(
        path,
        '<script src="/_next/static/chunks/app-a1.js"></script><link href="/_next/static/css/app-b2.css" rel="stylesheet">',
        {
          "content-type": "text/html",
          "cache-control": "public, max-age=0, must-revalidate",
        },
      );
    if (path.endsWith(".css"))
      return networkResponse(
        path,
        "@font-face { src: url(../media/inter-c3.woff2) }",
        {
          "content-type": "text/css",
          "cache-control": "public, max-age=31536000, immutable",
        },
      );
    return networkResponse(path, "asset", {
      "cache-control": "public, max-age=31536000, immutable",
    });
  };
  const key = (input: RequestInfo | URL) =>
    new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
      origin,
    ).href;
  const fetchMock = async (input: RequestInfo | URL) => {
    const url = key(input);
    fetches.push(url);
    return fetchResponse(url);
  };
  const open = async (name: string) => {
    if (!cacheData.has(name)) cacheData.set(name, new Map());
    const data = cacheData.get(name)!;
    return {
      match: async (input: RequestInfo | URL) => data.get(key(input))?.clone(),
      put: async (input: RequestInfo | URL, response: Response) => {
        data.set(key(input), response.clone());
      },
    };
  };
  const worker = {
    location: { origin },
    registration: { active: null as object | null },
    clients: { claim: async () => undefined },
    skipWaiting: async () => {
      skipped = true;
    },
    addEventListener: (type: string, handler: (event: WorkerEvent) => void) =>
      handlers.set(type, handler),
  };
  runInContext(
    workerSource,
    createContext({
      self: worker,
      caches: {
        open,
        keys: async () => [...cacheData.keys()],
        delete: async (name: string) => cacheData.delete(name),
      },
      fetch: fetchMock,
      URL,
      Request,
      Response,
      Map,
      Set,
      AbortSignal: { timeout: () => new AbortController().signal },
    }),
  );
  const dispatch = async (
    type: string,
    properties: Partial<WorkerEvent> = {},
  ) => {
    const pending: Promise<unknown>[] = [];
    let result: Promise<Response> | undefined;
    handlers.get(type)?.({
      ...properties,
      waitUntil: (promise) => {
        pending.push(promise);
      },
      respondWith: (promise) => {
        result = promise;
      },
    });
    const response = await result;
    await Promise.all(pending);
    return response;
  };
  const navigate = (path: string) => {
    const request = new Request(new URL(path, origin));
    Object.defineProperty(request, "mode", { value: "navigate" });
    return dispatch("fetch", { request });
  };
  return {
    cacheData,
    open,
    worker,
    fetches,
    dispatch,
    navigate,
    setFetch: (response: typeof fetchResponse) => {
      const previous = fetchResponse;
      fetchResponse = response;
      return previous;
    },
    skipped: () => skipped,
  };
}

test("worker warms matching scripts, CSS, and relative fonts before declaring all field screens ready offline", async () => {
  const harness = workerHarness();
  await harness.dispatch("install");
  const cache = await harness.open(cacheName);
  for (const path of shellPaths)
    expect(Boolean(await cache.match(path))).toBe(true);
  expect(Boolean(await cache.match("/_next/static/chunks/app-a1.js"))).toBe(
    true,
  );
  expect(Boolean(await cache.match("/_next/static/media/inter-c3.woff2"))).toBe(
    true,
  );
  expect(
    harness.fetches.filter((url) => url.endsWith("app-a1.js")).length,
  ).toBe(1);
  const messages: unknown[] = [];
  await harness.dispatch("message", {
    data: { type: "FIELD_OFFLINE_STATUS" },
    source: {
      postMessage: (message) => {
        messages.push(message);
      },
    },
  });
  expect(messages).toEqual([{ type: "FIELD_OFFLINE_STATUS", ready: true }]);
  harness.setFetch(() => {
    throw new TypeError("Offline");
  });
  expect(
    (await harness.navigate("/field/report?reportId=private-id"))?.status,
  ).toBe(200);
  expect(Boolean(await cache.match("/field/report?reportId=private-id"))).toBe(
    false,
  );
});

test("mutable development bundles bypass stale cache entries while immutable production bundles work offline", async () => {
  const harness = workerHarness();
  const cache = await harness.open(cacheName);
  const mutable = "/_next/static/chunks/development.js";
  await cache.put(
    mutable,
    networkResponse(mutable, "old UI", {
      "cache-control": "public, max-age=0",
    }),
  );
  harness.setFetch((url) =>
    networkResponse(url, "current UI", { "cache-control": "no-store" }),
  );
  const response = await harness.dispatch("fetch", {
    request: resourceRequest(mutable),
  });
  expect(await response?.text()).toBe("current UI");
  expect(await (await cache.match(mutable))?.text()).toBe("old UI");
  const immutable = "/_next/static/chunks/app-abc123.js";
  await cache.put(
    immutable,
    networkResponse(immutable, "matching UI", {
      "cache-control": "public, max-age=31536000, immutable",
    }),
  );
  harness.setFetch(() => {
    throw new TypeError("Offline");
  });
  expect(
    await (
      await harness.dispatch("fetch", {
        request: resourceRequest(immutable),
      })
    )?.text(),
  ).toBe("matching UI");
});

test("worker excludes APIs, private photos, auth, RSC, private report pages, and cross-origin resources", async () => {
  const harness = workerHarness();
  for (const path of [
    "/api/reports",
    "/api/reports/private-id/photo",
    "/auth/session",
    "/_next/data/build/field.json",
    "/field/reports/private-id",
    "/profile",
    "/command/map",
    "https://tiles.example.com/tile.png",
  ]) {
    const response = await harness.navigate(path);
    expect(response === undefined).toBe(true);
  }
  expect(
    (await harness.dispatch("fetch", {
      request: new Request(new URL("/field/home?_rsc=abc", origin), {
        headers: { RSC: "1" },
      }),
    })) === undefined,
  ).toBe(true);
  expect(
    (await harness.dispatch("fetch", {
      request: new Request(new URL("/api/reports", origin), { method: "POST" }),
    })) === undefined,
  ).toBe(true);
  expect(harness.fetches).toHaveLength(0);
});

test("private, no-store, cookie-setting, redirect, and incomplete shell responses never become offline documents", async () => {
  for (const scenario of [
    "private",
    "no-store",
    "cookie",
    "redirect",
    "missing-script",
  ]) {
    const harness = workerHarness();
    harness.setFetch((url) => {
      const path = new URL(url).pathname;
      if (!shellPaths.includes(path) && !path.startsWith("/_next/"))
        return networkResponse(path, "public asset", {
          "cache-control": "public, max-age=0",
        });
      if (scenario === "missing-script" && path.startsWith("/_next/"))
        return networkResponse(path, "unavailable", {}, 404);
      const headers: Record<string, string> = {
        "content-type": "text/html",
        "cache-control":
          scenario === "private" || scenario === "no-store"
            ? scenario
            : "public",
      };
      if (scenario === "cookie") headers["set-cookie"] = "session=example";
      return networkResponse(
        scenario === "redirect" ? "/login" : path,
        '<script src="/_next/static/chunks/missing.js"></script>',
        headers,
        200,
        scenario === "redirect",
      );
    });
    await harness.dispatch("install");
    const cache = await harness.open(cacheName);
    expect(Boolean(await cache.match("/field/home"))).toBe(false);
  }
});

test("worker migrates legacy caches and waits for approval before subsequent updates", async () => {
  const legacy = workerHarness();
  legacy.worker.registration.active = {};
  await legacy.open("peatguard-field-v4");
  await legacy.open("another-app-cache");
  await legacy.dispatch("install");
  expect(legacy.skipped()).toBe(true);
  await legacy.dispatch("activate");
  expect(legacy.cacheData.has("peatguard-field-v4")).toBe(false);
  expect(legacy.cacheData.has("another-app-cache")).toBe(true);
  const updated = workerHarness();
  updated.worker.registration.active = {};
  await updated.dispatch("install");
  expect(updated.skipped()).toBe(false);
  await updated.dispatch("message", { data: { type: "ACTIVATE_UPDATE" } });
  expect(updated.skipped()).toBe(true);
});

test("offline preparation retries missing shells when the connection becomes available", async () => {
  const harness = workerHarness();
  const goodResponse: (url: string) => Response = harness.setFetch((url) =>
    new URL(url).pathname === "/field/reports/create"
      ? networkResponse(url, "Unavailable", {}, 503)
      : goodResponse(url),
  );
  await harness.dispatch("install");
  const messages: unknown[] = [];
  const source = {
    postMessage: (value: unknown) => {
      messages.push(value);
    },
  };
  await harness.dispatch("message", {
    data: { type: "FIELD_OFFLINE_STATUS" },
    source,
  });
  expect(messages).toEqual([{ type: "FIELD_OFFLINE_STATUS", ready: false }]);
  harness.setFetch(goodResponse);
  await harness.dispatch("message", {
    data: { type: "PREPARE_FIELD_OFFLINE" },
    source,
  });
  expect(messages.at(-1)).toEqual({
    type: "FIELD_OFFLINE_STATUS",
    ready: true,
  });
});

test("an incomplete update preserves prepared shells from the preceding version", async () => {
  const harness = workerHarness();
  const previous = await harness.open("peatguard-field-v6");
  for (const path of shellPaths) {
    await previous.put(
      path,
      networkResponse(path, "Previous shell", { "content-type": "text/html" }),
    );
  }
  const normalFetch = harness.setFetch(() => {
    throw new TypeError("Offline");
  });
  harness.setFetch((request) =>
    new URL(request).pathname.startsWith("/field/")
      ? networkResponse(request, "Preparing", {}, 503)
      : normalFetch(request),
  );
  await harness.dispatch("install");
  await harness.dispatch("activate");
  harness.setFetch(() => {
    throw new TypeError("Offline");
  });
  expect(await (await harness.navigate("/field/reports/create"))?.text()).toBe(
    "Previous shell",
  );
  expect(harness.cacheData.has("peatguard-field-v6")).toBe(true);
});
