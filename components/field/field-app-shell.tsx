"use client";

import { Home, ListChecks, TreeDeciduous, Wifi, WifiOff } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";
import { canUseDemoSamples as canUseLocalDemoSamples } from "@/lib/client/offline/demo-samples";
import {
  clearLastKnownOwner,
  getLastKnownOwnerSnapshot,
  getServerOwnerSnapshot,
  isActiveVolunteerOwnerMatch,
  isFieldRoleDenied,
  isFieldVolunteerRole,
  isSessionAuthDenied,
  persistLastKnownOwner,
  subscribeLastKnownOwner,
} from "@/lib/client/offline/owner-store";
import { listQueuedReports } from "@/lib/client/offline/report-store";
import { syncQueuedReports } from "@/lib/client/offline/sync-manager";
import type {
  QueuedFieldReport,
  SyncSummary,
} from "@/lib/client/offline/types";

/* eslint-disable @next/next/no-html-link-for-pages -- Full navigations let the service worker serve cached field shells offline. */

type FieldShellContextValue = {
  online: boolean;
  simulatedOffline: boolean;
  isConnected: boolean;
  ownerId: string | null;
  ownerStatus: FieldOwnerStatus;
  canUseDemoSamples: boolean;
  queueCount: number;
  isSyncing: boolean;
  lastSyncSummary: SyncSummary | null;
  notice: string;
  setNotice: (message: string) => void;
  toggleSimulatedOffline: () => void;
  refreshQueue: () => Promise<QueuedFieldReport[]>;
  syncNow: () => Promise<SyncSummary | null>;
};

export type FieldOwnerStatus =
  | "authenticated"
  | "offline-known"
  | "loading"
  | "role-denied"
  | "signed-out"
  | "unavailable";

const FieldShellContext = createContext<FieldShellContextValue | null>(null);

export function useFieldShell(): FieldShellContextValue {
  const context = useContext(FieldShellContext);
  if (!context) {
    throw new Error("useFieldShell harus digunakan di dalam FieldAppShell.");
  }
  return context;
}

export function ownerStatusMessage(status: FieldOwnerStatus): string {
  if (status === "loading") return "Memeriksa sesi akun relawan…";
  if (status === "signed-out")
    return "Masuk ke akun relawan sebelum membuat laporan.";
  if (status === "role-denied")
    return "Halaman laporan lapangan hanya tersedia untuk akun RELAWAN.";
  if (status === "unavailable") {
    return "Perangkat belum mengenal akun pemilik. Hubungkan ke internet dan masuk sekali untuk mengaktifkan laporan offline.";
  }
  if (status === "offline-known") {
    return "Draf offline akan dikaitkan dengan akun terakhir yang berhasil diverifikasi.";
  }
  return "Akun relawan sudah terverifikasi.";
}

const SIMULATED_OFFLINE_KEY = "peatguard:field:simulated-offline";
const offlineListeners = new Set<() => void>();
const clockListeners = new Set<() => void>();
let clockSnapshot = "--:--";
let clockInterval: number | null = null;

function subscribeOnline(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

function getSimulatedOfflineSnapshot() {
  try {
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === "1";
  } catch {
    return false;
  }
}

function notifyOfflineListeners() {
  offlineListeners.forEach((listener) => listener());
}

function subscribeSimulatedOffline(listener: () => void) {
  offlineListeners.add(listener);
  window.addEventListener("storage", notifyOfflineListeners);
  return () => {
    offlineListeners.delete(listener);
    window.removeEventListener("storage", notifyOfflineListeners);
  };
}

function formatDeviceTime() {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function notifyClockListeners() {
  clockSnapshot = formatDeviceTime();
  clockListeners.forEach((listener) => listener());
}

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockInterval === null) {
    clockSnapshot = formatDeviceTime();
    clockInterval = window.setInterval(notifyClockListeners, 60_000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockInterval !== null) {
      window.clearInterval(clockInterval);
      clockInterval = null;
    }
  };
}

function getClockSnapshot() {
  return clockSnapshot;
}

function getServerClockSnapshot() {
  return "--:--";
}

export function FieldAppShell({
  children,
  demoSamplesEnabled,
}: {
  children: ReactNode;
  demoSamplesEnabled: boolean;
}) {
  const pathname = usePathname();
  const {
    data: session,
    isPending: isSessionPending,
    isRefetching: isSessionRefetching,
    error: sessionError,
  } = authClient.useSession();
  const sessionUser = session?.user ?? null;
  const sessionRole = sessionUser ? Reflect.get(sessionUser, "role") : null;
  const sessionRoleIsDenied = isFieldRoleDenied(
    Boolean(sessionUser),
    sessionRole,
  );
  const online = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerSnapshot,
  );
  const simulatedOffline = useSyncExternalStore(
    subscribeSimulatedOffline,
    getSimulatedOfflineSnapshot,
    getServerSnapshot,
  );
  const lastKnownOwnerId = useSyncExternalStore(
    subscribeLastKnownOwner,
    getLastKnownOwnerSnapshot,
    getServerOwnerSnapshot,
  );
  const activeSessionOwnerId =
    !isSessionPending &&
    !isSessionRefetching &&
    !sessionError &&
    isFieldVolunteerRole(sessionRole)
      ? (sessionUser?.id ?? null)
      : null;
  const sessionIsUnauthorized = sessionError?.status === 401;
  const sessionIsForbidden = sessionError?.status === 403;
  const sessionIsAuthDenied = isSessionAuthDenied(sessionError?.status);
  const canUseOfflineOwner =
    (!online || simulatedOffline) &&
    !sessionRoleIsDenied &&
    !sessionIsAuthDenied;
  const ownerId =
    activeSessionOwnerId ??
    (canUseOfflineOwner &&
    (isSessionPending ||
      isSessionRefetching ||
      (sessionError && !sessionIsAuthDenied))
      ? lastKnownOwnerId
      : null);
  const ownerStatus: FieldOwnerStatus =
    sessionRoleIsDenied || sessionIsForbidden
      ? "role-denied"
      : activeSessionOwnerId
        ? "authenticated"
        : canUseOfflineOwner &&
            (isSessionPending ||
              isSessionRefetching ||
              (sessionError && !sessionIsAuthDenied))
          ? lastKnownOwnerId
            ? "offline-known"
            : "unavailable"
          : isSessionPending || isSessionRefetching
            ? "loading"
            : sessionIsUnauthorized
              ? "signed-out"
              : sessionError
                ? "unavailable"
                : "signed-out";
  const [queueSnapshot, setQueueSnapshot] = useState<{
    ownerId: string | null;
    count: number;
  }>({ ownerId: null, count: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSummary, setLastSyncSummary] = useState<SyncSummary | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const deviceTime = useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );
  const isConnected = online && !simulatedOffline;
  const queueCount =
    queueSnapshot.ownerId === ownerId ? queueSnapshot.count : 0;
  const canUseDemoSamples = canUseLocalDemoSamples({
    demoLoginEnabled: demoSamplesEnabled,
    ownerId,
    hasVerifiedDemoSession:
      ownerStatus === "authenticated" &&
      isFieldVolunteerRole(sessionRole) &&
      ownerId === activeSessionOwnerId,
    offlineKnownVolunteerOwner: ownerStatus === "offline-known",
    sessionEmail: sessionUser?.email ?? null,
  });

  useEffect(() => {
    if (sessionRoleIsDenied || sessionIsAuthDenied) {
      clearLastKnownOwner();
      return;
    }

    if (activeSessionOwnerId) {
      persistLastKnownOwner(activeSessionOwnerId, sessionRole);
      return;
    }

    if (
      session === null &&
      !isSessionPending &&
      !isSessionRefetching &&
      (!sessionError || sessionIsAuthDenied)
    ) {
      clearLastKnownOwner();
    }
  }, [
    activeSessionOwnerId,
    isSessionPending,
    isSessionRefetching,
    session,
    sessionError,
    sessionIsUnauthorized,
    sessionIsAuthDenied,
    sessionIsForbidden,
    sessionRole,
    sessionRoleIsDenied,
  ]);

  const refreshQueue = useCallback(async () => {
    if (!ownerId) {
      setQueueSnapshot({ ownerId: null, count: 0 });
      return [];
    }
    try {
      const reports = await listQueuedReports(ownerId);
      setQueueSnapshot({
        ownerId,
        count: reports.filter((report) => report.syncState !== "synced").length,
      });
      return reports;
    } catch {
      setNotice(
        "Penyimpanan laporan offline tidak dapat dibuka di perangkat ini.",
      );
      return [];
    }
  }, [ownerId, setNotice, setQueueSnapshot]);

  const syncNow = useCallback(async () => {
    if (!online || simulatedOffline) {
      setNotice(
        "Laporan aman tersimpan di perangkat. Hubungkan kembali untuk sinkronisasi.",
      );
      return null;
    }

    if (
      !ownerId ||
      ownerStatus !== "authenticated" ||
      !isActiveVolunteerOwnerMatch(ownerId, activeSessionOwnerId, sessionRole)
    ) {
      setNotice(
        ownerId
          ? "Sesi aktif belum cocok dengan pemilik antrean. Masuk kembali ke akun pemilik sebelum mengirim."
          : "Masuk online sekali agar laporan tersimpan dengan akun pemilik yang benar.",
      );
      return null;
    }

    setIsSyncing(true);
    setNotice("Menyinkronkan laporan ke posko…");
    try {
      const summary = await syncQueuedReports(
        ownerId,
        () => void refreshQueue(),
        true,
      );
      setLastSyncSummary(summary);
      const message =
        summary.failed || summary.requiresAuth
          ? `${summary.synced} terkirim, ${summary.failed + summary.requiresAuth} masih perlu perhatian.`
          : summary.synced
            ? `${summary.synced} laporan berhasil dikirim ke posko.`
            : "Tidak ada laporan yang menunggu sinkronisasi.";
      setNotice(message);
      await refreshQueue();
      return summary;
    } catch {
      setNotice(
        "Sinkronisasi belum berhasil. Laporan tetap aman di perangkat.",
      );
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [
    activeSessionOwnerId,
    online,
    ownerId,
    ownerStatus,
    refreshQueue,
    setIsSyncing,
    setLastSyncSummary,
    setNotice,
    sessionRole,
    simulatedOffline,
  ]);

  useEffect(() => {
    const queueTimer = window.setTimeout(() => void refreshQueue(), 0);
    if ("serviceWorker" in navigator && window.isSecureContext) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          setNotice(
            "Mode offline belum aktif. Pastikan aplikasi dibuka melalui HTTPS atau localhost.",
          );
        });
    }
    return () => window.clearTimeout(queueTimer);
  }, [refreshQueue]);

  const syncAutomatically = useCallback(async () => {
    if (
      !isConnected ||
      !ownerId ||
      ownerStatus !== "authenticated" ||
      !isActiveVolunteerOwnerMatch(ownerId, activeSessionOwnerId, sessionRole)
    ) {
      return;
    }

    setIsSyncing(true);
    try {
      const summary = await syncQueuedReports(
        ownerId,
        () => void refreshQueue(),
      );
      if (
        summary.synced > 0 ||
        summary.failed > 0 ||
        summary.requiresAuth > 0
      ) {
        setLastSyncSummary(summary);
        void refreshQueue();
      }
    } catch {
      setNotice(
        "Sinkronisasi otomatis gagal. Laporan tetap tersimpan di perangkat.",
      );
    } finally {
      setIsSyncing(false);
    }
  }, [
    activeSessionOwnerId,
    isConnected,
    ownerId,
    ownerStatus,
    refreshQueue,
    setIsSyncing,
    setLastSyncSummary,
    setNotice,
    sessionRole,
  ]);

  useEffect(() => {
    if (
      !isConnected ||
      queueCount === 0 ||
      ownerStatus !== "authenticated" ||
      !isActiveVolunteerOwnerMatch(
        ownerId ?? "",
        activeSessionOwnerId,
        sessionRole,
      )
    )
      return;

    const timerId = window.setTimeout(() => {
      void syncAutomatically();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [
    activeSessionOwnerId,
    isConnected,
    ownerId,
    ownerStatus,
    queueCount,
    sessionRole,
    syncAutomatically,
  ]);

  const toggleSimulatedOffline = useCallback(() => {
    const nextValue = !getSimulatedOfflineSnapshot();
    try {
      localStorage.setItem(SIMULATED_OFFLINE_KEY, nextValue ? "1" : "0");
      notifyOfflineListeners();
    } catch {
      setNotice(
        "Preferensi simulasi offline tidak dapat disimpan di browser ini.",
      );
    }
  }, [setNotice]);

  const contextValue = useMemo(
    () => ({
      online,
      simulatedOffline,
      isConnected,
      ownerId,
      ownerStatus,
      canUseDemoSamples,
      queueCount,
      isSyncing,
      lastSyncSummary,
      notice,
      setNotice,
      toggleSimulatedOffline,
      refreshQueue,
      syncNow,
    }),
    [
      isConnected,
      isSyncing,
      lastSyncSummary,
      notice,
      online,
      ownerId,
      ownerStatus,
      canUseDemoSamples,
      queueCount,
      refreshQueue,
      simulatedOffline,
      setNotice,
      syncNow,
      toggleSimulatedOffline,
    ],
  );

  const activeRoute = pathname.startsWith("/field/queue")
    ? "queue"
    : pathname.startsWith("/field/reports/create")
      ? "create"
      : "home";

  if (ownerStatus === "role-denied") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg items-start justify-center bg-background px-5 pt-16">
        <section
          className="w-full rounded-2xl border border-border bg-white p-5 shadow-sm"
          role="alert"
          aria-labelledby="field-role-denied-title"
        >
          <h1
            id="field-role-denied-title"
            className="font-heading text-2xl font-bold text-peat-forest"
          >
            Akses laporan lapangan dibatasi
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Hanya akun RELAWAN yang dapat membuka, melihat, membuat, dan
            mengirim laporan lapangan. Ganti ke akun relawan untuk melanjutkan.
          </p>
        </section>
      </main>
    );
  }

  return (
    <FieldShellContext.Provider value={contextValue}>
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col border-x border-border bg-background shadow-sm">
        <header className="sticky top-0 z-30">
          <div className="flex h-8 items-center justify-between bg-peat-forest px-5 text-[11px] font-semibold text-white">
            <span aria-label="Waktu perangkat">{deviceTime}</span>
            <span className="flex items-center gap-2" aria-live="polite">
              {isConnected ? (
                <Wifi aria-hidden="true" size={15} />
              ) : (
                <WifiOff aria-hidden="true" size={15} />
              )}
              <span>
                {ownerStatus === "signed-out"
                  ? "Masuk untuk menyimpan laporan"
                  : ownerStatus === "loading"
                    ? "Memeriksa sesi relawan…"
                    : ownerStatus === "unavailable"
                      ? "Akun perangkat belum dikenali"
                      : ownerStatus === "offline-known"
                        ? "Offline · akun terakhir dikenali"
                        : isConnected
                          ? "Online · terhubung ke posko"
                          : "Offline · tersimpan di perangkat"}
              </span>
            </span>
          </div>
          <div className="flex h-10 items-center justify-between bg-peat-forest/90 px-4 text-xs text-white">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${isConnected ? "bg-peat-leaf" : "bg-offline"}`}
              />
              <span className="truncate">
                {ownerStatus === "authenticated"
                  ? isConnected
                    ? "Sesi relawan aktif"
                    : "Antrean tersimpan"
                  : ownerStatus === "offline-known"
                    ? "Draf terkait akun terakhir"
                    : "Akun belum diverifikasi"}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span>Simulasi</span>
              <button
                type="button"
                aria-label="Simulasikan mode offline"
                aria-pressed={simulatedOffline}
                onClick={toggleSimulatedOffline}
                className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white ${simulatedOffline ? "bg-offline" : "bg-white/35"}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-1 size-5 rounded-full bg-white shadow transition-transform ${simulatedOffline ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              {queueCount > 0 ? (
                <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-peat-forest">
                  Antrean {queueCount}
                </span>
              ) : null}
            </span>
          </div>
          <div className="flex h-[58px] items-center justify-between border-b border-border bg-background px-5">
            <a
              href="/field/home"
              className="flex items-center gap-2 text-peat-forest"
              aria-label="PEATGUARD, beranda relawan"
            >
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-secondary text-peat-green"
              >
                <TreeDeciduous size={21} />
              </span>
              <span className="font-heading text-xl font-bold tracking-tight">
                PEATGUARD
              </span>
            </a>
            <span className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold text-muted-foreground">
              MPA · demo
            </span>
          </div>
        </header>

        {notice ? (
          <div
            className="fixed top-[108px] left-1/2 z-50 w-[min(calc(100%-2rem),28rem)] -translate-x-1/2"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-lg">
              <p>{notice}</p>
              <button
                type="button"
                className="min-h-11 shrink-0 rounded-lg px-2 text-peat-green"
                aria-label="Tutup pemberitahuan"
                onClick={() => setNotice("")}
              >
                Tutup
              </button>
            </div>
          </div>
        ) : null}

        <main className="flex-1 pb-24">{children}</main>

        <nav
          aria-label="Navigasi relawan"
          className="fixed inset-x-0 bottom-0 z-40 mx-auto grid h-[74px] w-full max-w-lg grid-cols-3 items-center border-t border-border bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(31,77,61,0.08)] backdrop-blur"
        >
          <a
            href="/field/home"
            aria-current={activeRoute === "home" ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-peat-green ${activeRoute === "home" ? "font-semibold text-peat-green" : "text-muted-foreground"}`}
          >
            <Home aria-hidden="true" size={20} />
            Beranda
          </a>
          <a
            href="/field/reports/create"
            aria-current={activeRoute === "create" ? "page" : undefined}
            className="mx-auto flex min-h-11 w-[134px] items-center justify-center rounded-xl bg-peat-green px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-peat-forest focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest"
          >
            + Lapor temuan
          </a>
          <a
            href="/field/queue"
            aria-current={activeRoute === "queue" ? "page" : undefined}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-peat-green ${activeRoute === "queue" ? "font-semibold text-peat-green" : "text-muted-foreground"}`}
          >
            <ListChecks aria-hidden="true" size={20} />
            Antrean
            {queueCount ? (
              <span className="absolute top-1 right-4 grid min-h-5 min-w-5 place-items-center rounded-full bg-offline px-1 text-[10px] font-bold text-white">
                {queueCount}
              </span>
            ) : null}
          </a>
        </nav>
      </div>
    </FieldShellContext.Provider>
  );
}
