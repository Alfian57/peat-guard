const CACHE_NAME = "peatguard-field-v8";
const CACHE_PREFIX = "peatguard-field-";
const STATIC_ASSETS = [
  "/offline.html",
  "/brand/logo-horizontal.png",
  "/brand/logo-symbol.png",
  "/brand/logo-circle.png",
  "/brand/app-icon-192.png",
  "/brand/app-icon-512.png",
  "/brand/app-icon-maskable-512.png",
  "/maplibre-gl-worker.mjs",
];
const FIELD_SHELL_PATHS = new Set([
  "/field/home",
  "/field/reports/create",
  "/field/queue",
  "/field/report",
]);

function canCacheResponse(response) {
  return (
    response.ok &&
    !response.redirected &&
    !/private|no-store/i.test(response.headers.get("cache-control") ?? "") &&
    !response.headers.has("set-cookie")
  );
}

function isCacheableShell(response, pathname) {
  return (
    canCacheResponse(response) &&
    (response.headers.get("content-type") ?? "").includes("text/html") &&
    new URL(response.url).origin === self.location.origin &&
    new URL(response.url).pathname === pathname
  );
}

function isImmutableAsset(response) {
  return (
    canCacheResponse(response) &&
    /\bimmutable\b/i.test(response.headers.get("cache-control") ?? "")
  );
}

function nextAssetUrls(source, baseUrl = self.location.origin) {
  const urls = new Set();
  const references = source.matchAll(
    /(?:\/_next\/static\/|static\/(?:chunks|css|media)\/)[^\s"'<>\\)]+/g,
  );
  for (const reference of references) {
    const path = reference[0].startsWith("/")
      ? reference[0]
      : `/_next/${reference[0]}`;
    const url = new URL(path.replaceAll("&amp;", "&"), self.location.origin);
    if (
      url.origin === self.location.origin &&
      /\.(?:js|css|woff2?|ttf|otf)$/.test(url.pathname)
    )
      urls.add(url.href);
  }
  for (const match of source.matchAll(/url\(["']?([^\s"'()]+)["']?\)/g)) {
    const url = new URL(match[1], baseUrl);
    if (
      url.origin === self.location.origin &&
      url.pathname.startsWith("/_next/static/") &&
      /\.(?:woff2?|ttf|otf)$/.test(url.pathname)
    )
      urls.add(url.href);
  }
  return [...urls];
}

async function warmAsset(cache, url, pending) {
  if (pending.has(url)) return pending.get(url);
  const task = (async () => {
    const cached = await cache.match(url);
    if (cached && isImmutableAsset(cached)) return;
    const response = await fetch(
      new Request(url, {
        cache: "reload",
        signal: AbortSignal.timeout(15_000),
      }),
    );
    if (!isImmutableAsset(response)) throw new Error("Asset is not immutable");
    if ((response.headers.get("content-type") ?? "").includes("text/css")) {
      await Promise.all(
        nextAssetUrls(await response.clone().text(), url).map((asset) =>
          warmAsset(cache, asset, pending),
        ),
      );
    }
    await cache.put(url, response);
  })();
  pending.set(url, task);
  try {
    await task;
  } catch (error) {
    pending.delete(url);
    throw error;
  }
}

async function cacheShell(cache, pathname, response, pending = new Map()) {
  if (!isCacheableShell(response, pathname)) return;
  const html = await response.clone().text();
  const assets = nextAssetUrls(html);
  // A cached document without its matching scripts cannot boot offline.
  if (!assets.length) return;
  await Promise.all(assets.map((url) => warmAsset(cache, url, pending)));
  await cache.put(new URL(pathname, self.location.origin).href, response);
}

async function generationReady(cache) {
  const shells = await Promise.all(
    [...FIELD_SHELL_PATHS].map((path) =>
      cache.match(new URL(path, self.location.origin).href),
    ),
  );
  return shells.every(Boolean);
}

async function previousGenerations() {
  const names = await caches.keys();
  return names
    .filter(
      (name) =>
        name !== CACHE_NAME &&
        /^peatguard-field-v(?:[5-9]|[1-9]\d+)$/.test(name),
    )
    .reverse();
}

async function cachedFieldResponse(key, primary) {
  const response = await primary.match(key);
  if (response) return response;
  for (const name of await previousGenerations()) {
    const previous = await (await caches.open(name)).match(key);
    if (previous) return previous;
  }
  return undefined;
}

async function offlineReady() {
  if (await generationReady(await caches.open(CACHE_NAME))) return true;
  for (const name of await previousGenerations()) {
    if (await generationReady(await caches.open(name))) return true;
  }
  return false;
}

let preparation;
async function prepareFieldShells() {
  if (preparation) return preparation;
  preparation = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const pending = new Map();
    await Promise.allSettled(
      [...FIELD_SHELL_PATHS].map(async (path) => {
        const response = await fetch(
          new Request(new URL(path, self.location.origin), {
            headers: { Accept: "text/html" },
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
          }),
        );
        await cacheShell(cache, path, response, pending);
      }),
    );
  })();
  try {
    await preparation;
  } finally {
    preparation = undefined;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const migratingLegacyCache = names.some((name) =>
        /^peatguard-field-v[1-4]$/.test(name),
      );
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        STATIC_ASSETS.map(async (path) => {
          const response = await fetch(
            new Request(new URL(path, self.location.origin), {
              cache: "reload",
              signal: AbortSignal.timeout(10_000),
            }),
          );
          if (!canCacheResponse(response))
            throw new Error("Public asset unavailable");
          await cache.put(new URL(path, self.location.origin).href, response);
        }),
      );
      await prepareFieldShells();
      // Migrate the old mutable-bundle cache once. Later updates wait for the user.
      if (!self.registration.active || migratingLegacyCache)
        await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const previous = await previousGenerations();
      const keep = new Set([CACHE_NAME, previous[0]]);
      for (const name of previous) {
        if (await generationReady(await caches.open(name))) {
          keep.add(name);
          break;
        }
      }
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && !keep.has(name))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") {
    event.waitUntil(self.skipWaiting());
  } else if (
    event.data?.type === "FIELD_OFFLINE_STATUS" ||
    event.data?.type === "PREPARE_FIELD_OFFLINE"
  ) {
    event.waitUntil(
      (async () => {
        if (
          event.data.type === "PREPARE_FIELD_OFFLINE" &&
          !(await generationReady(await caches.open(CACHE_NAME)))
        )
          await prepareFieldShells();
        event.source?.postMessage({
          type: "FIELD_OFFLINE_STATUS",
          ready: await offlineReady(),
        });
      })(),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_next/data/") ||
    request.headers.has("RSC") ||
    url.searchParams.has("_rsc")
  )
    return;

  if (request.mode === "navigate") {
    if (!FIELD_SHELL_PATHS.has(url.pathname)) return;
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const shellKey = new URL(url.pathname, self.location.origin).href;
        try {
          const response = await fetch(request, {
            signal: AbortSignal.timeout(6_000),
          });
          if (response.status >= 500) throw new Error("Server unavailable");
          event.waitUntil(
            cacheShell(cache, url.pathname, response.clone()).catch(
              () => undefined,
            ),
          );
          return response;
        } catch {
          return (
            (await cachedFieldResponse(shellKey, cache)) ??
            (await cachedFieldResponse("/offline.html", cache)) ??
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  const isNextAsset = url.pathname.startsWith("/_next/static/");
  if (!isNextAsset && !STATIC_ASSETS.includes(url.pathname)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cachedFieldResponse(request, cache);
      if (cached && (!isNextAsset || isImmutableAsset(cached))) return cached;
      const response = await fetch(request);
      if (isNextAsset ? isImmutableAsset(response) : canCacheResponse(response))
        await cache.put(request, response.clone());
      return response;
    })(),
  );
});
