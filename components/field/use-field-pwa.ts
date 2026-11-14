"use client";

import { useCallback, useEffect, useState } from "react";
import { usePwaInstall } from "@/components/pwa/pwa-install-provider";
import { configureFieldServiceWorker } from "@/lib/client/offline/service-worker";

type OfflineStatus = "preparing" | "ready" | "unavailable" | "development";

export function useFieldPwa() {
  const { canInstall, error, install, installed, ios, isInstalling } =
    usePwaInstall();
  const [status, setStatus] = useState<OfflineStatus>("preparing");
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    const cleanups: Array<() => void> = [];
    void configureFieldServiceWorker(process.env.NODE_ENV === "production")
      .then((registration) => {
        if (!active) return;
        if (process.env.NODE_ENV !== "production") {
          setStatus("development");
          return;
        }
        if (!registration) {
          setStatus("unavailable");
          return;
        }
        const inspectWorker = () => {
          if (active && registration.waiting)
            setWaitingWorker(registration.waiting);
        };
        const checkReadiness = () => {
          navigator.serviceWorker.controller?.postMessage({
            type: navigator.onLine
              ? "PREPARE_FIELD_OFFLINE"
              : "FIELD_OFFLINE_STATUS",
          });
        };
        const onMessage = (event: MessageEvent<unknown>) => {
          if (
            !active ||
            !event.data ||
            typeof event.data !== "object" ||
            !("type" in event.data) ||
            event.data.type !== "FIELD_OFFLINE_STATUS"
          )
            return;
          setStatus(
            "ready" in event.data && event.data.ready === true
              ? "ready"
              : "unavailable",
          );
        };
        const onUpdate = () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", inspectWorker);
          cleanups.push(() =>
            worker.removeEventListener("statechange", inspectWorker),
          );
        };
        navigator.serviceWorker.addEventListener("message", onMessage);
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          checkReadiness,
        );
        window.addEventListener("focus", checkReadiness);
        window.addEventListener("online", checkReadiness);
        registration.addEventListener("updatefound", onUpdate);
        cleanups.push(() => {
          navigator.serviceWorker.removeEventListener("message", onMessage);
          navigator.serviceWorker.removeEventListener(
            "controllerchange",
            checkReadiness,
          );
          registration.removeEventListener("updatefound", onUpdate);
          window.removeEventListener("focus", checkReadiness);
          window.removeEventListener("online", checkReadiness);
        });
        inspectWorker();
        onUpdate();
        checkReadiness();
        void navigator.serviceWorker.ready.then(() => {
          if (active) checkReadiness();
        });
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });

    return () => {
      active = false;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  const update = useCallback(() => {
    if (!waitingWorker) return;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
    waitingWorker.postMessage({ type: "ACTIVATE_UPDATE" });
  }, [waitingWorker]);

  return {
    status,
    installed,
    ios,
    canInstall,
    isInstalling,
    install,
    update,
    updateAvailable: waitingWorker !== null,
    error,
  };
}

export type FieldPwaState = ReturnType<typeof useFieldPwa>;
