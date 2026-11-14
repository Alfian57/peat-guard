import { APP_ROUTES } from "@/lib/routes";

function isFieldWorker(worker: ServiceWorker | null): boolean {
  if (!worker) return false;
  const url = new URL(worker.scriptURL, window.location.origin);
  return (
    url.origin === window.location.origin &&
    url.pathname === APP_ROUTES.pwa.worker
  );
}

export async function configureFieldServiceWorker(
  isProduction: boolean,
): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  if (!isProduction) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter(
          (registration) =>
            isFieldWorker(registration.active) ||
            isFieldWorker(registration.waiting) ||
            isFieldWorker(registration.installing),
        )
        .map((registration) => registration.unregister()),
    );
    if ("caches" in window) {
      const names = await window.caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("peatguard-field-"))
          .map((name) => window.caches.delete(name)),
      );
    }
    return null;
  }

  if (!window.isSecureContext)
    throw new Error("Aplikasi offline memerlukan HTTPS atau localhost.");
  return navigator.serviceWorker.register(APP_ROUTES.pwa.worker, {
    scope: APP_ROUTES.home,
    updateViaCache: "none",
  });
}
