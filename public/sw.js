const CACHE_NAME = "peatguard-field-v4";
const STATIC_ASSETS = [
  "/offline.html",
  "/brand/logo-horizontal.png",
  "/brand/logo-symbol.png",
  "/brand/logo-circle.png",
  "/brand/app-icon-192.png",
  "/brand/app-icon-512.png",
  "/brand/app-icon-maskable-512.png",
  "/samples/asap-gambut.webp",
  "/samples/kanal-kering.webp",
  "/samples/hutan-aman.webp",
];
const FIELD_SHELL_PATHS = new Set([
  "/field/home",
  "/field/reports/create",
  "/field/queue",
  "/field/report",
]);

function isCacheableShell(response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  return (
    response.ok &&
    (response.headers.get("content-type") ?? "").includes("text/html") &&
    !/private|no-store/i.test(cacheControl) &&
    !response.headers.has("set-cookie")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      await Promise.allSettled(
        [...FIELD_SHELL_PATHS].map(async (path) => {
          const response = await fetch(
            new Request(new URL(path, self.location.origin), {
              headers: { Accept: "text/html" },
              cache: "no-store",
              // A slow shell must not block activation of the cached brand assets.
              signal: AbortSignal.timeout(10_000),
            }),
          );
          if (isCacheableShell(response)) {
            await cache.put(
              new Request(new URL(path, self.location.origin)),
              response,
            );
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("peatguard-field-") && key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API, auth, or RSC data. Report photos live only in IndexedDB.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_next/data/")
  )
    return;

  if (request.mode === "navigate") {
    if (!FIELD_SHELL_PATHS.has(url.pathname)) return;
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const shellKey = new Request(
          new URL(url.pathname, self.location.origin),
        );
        try {
          const response = await fetch(request);
          if (isCacheableShell(response))
            await cache.put(shellKey, response.clone());
          return response;
        } catch {
          return (
            (await cache.match(shellKey)) ??
            (await cache.match("/offline.html")) ??
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/samples/") ||
    STATIC_ASSETS.includes(url.pathname);
  if (!isStaticAsset) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      const cacheControl = response.headers.get("cache-control") ?? "";
      if (
        response.ok &&
        !/private|no-store/i.test(cacheControl) &&
        !response.headers.has("set-cookie")
      ) {
        await cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
