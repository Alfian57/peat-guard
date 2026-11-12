"use client";

import { Wifi, WifiOff } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";
import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { GlobalSearch } from "@/components/search/global-search";
import { FieldBrand } from "@/components/field/field-brand";
import { FieldNavigation } from "@/components/field/field-navigation";
import { FieldStatusWidget } from "@/components/field/field-status-widget";
import { FieldBottomNav } from "@/components/field/field-bottom-nav";
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
import { APP_ROUTES } from "@/lib/routes";

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
  const activeOwnerIdRef = useRef(ownerId);
  const isMountedRef = useRef(false);
  useLayoutEffect(() => {
    activeOwnerIdRef.current = ownerId;
  }, [ownerId]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
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
    if (!ownerId) return [];
    const requestedOwnerId = ownerId;
    try {
      const reports = await listQueuedReports(requestedOwnerId);
      if (
        !isMountedRef.current ||
        activeOwnerIdRef.current !== requestedOwnerId
      ) {
        return [];
      }
      setQueueSnapshot({
        ownerId: requestedOwnerId,
        count: reports.filter((report) => report.syncState !== "synced").length,
      });
      return reports;
    } catch {
      if (
        !isMountedRef.current ||
        activeOwnerIdRef.current !== requestedOwnerId
      ) {
        return [];
      }
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

  const activeRoute = pathname.startsWith(APP_ROUTES.field.queue)
    ? "queue"
    : pathname.startsWith(APP_ROUTES.field.createReport)
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
      <div className="min-h-dvh bg-[#fbfaf6] lg:flex">
        {/* Desktop Sidebar (lg:flex, hidden on mobile) */}
        <aside className="sidebar-scroll sticky top-0 z-30 hidden h-dvh w-72 shrink-0 flex-col justify-between overflow-x-hidden overflow-y-auto overscroll-contain border-r border-[#49483f] bg-gradient-to-b from-[#292b29] via-[#32312d] to-[#3c3930] px-6 py-7 shadow-[8px_0_28px_rgba(0,0,0,0.12)] lg:flex">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-peat-sun/15 blur-3xl"
          />
          <div className="relative">
            <FieldBrand tone="dark" />
            <FieldNavigation dark pathname={pathname} queueCount={queueCount} />
          </div>
          <div className="relative mt-auto pt-6">
            <FieldStatusWidget
              isConnected={isConnected}
              isSyncing={isSyncing}
              ownerStatus={ownerStatus}
              queueCount={queueCount}
              simulatedOffline={simulatedOffline}
              syncNow={syncNow}
              toggleSimulatedOffline={toggleSimulatedOffline}
            />
          </div>
        </aside>

        {/* Main layout area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop Sticky Header (hidden on mobile) */}
          <header className="sticky top-0 z-20 hidden border-b border-[#e7e6dd] bg-[#fbfaf6]/90 backdrop-blur-xl lg:block">
            <div className="mx-auto flex min-h-[4.5rem] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-9">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <GlobalSearch variant="bar" />
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-peat-forest/15 bg-white px-3 py-1.5 text-xs font-semibold text-peat-forest">
                  <span
                    aria-hidden="true"
                    className={`size-2 shrink-0 rounded-full ${isConnected ? "bg-peat-leaf" : "bg-offline"}`}
                  />
                  <span>
                    {ownerStatus === "authenticated"
                      ? isConnected
                        ? "Online · Terhubung"
                        : "Offline · Tersimpan"
                      : ownerStatus === "offline-known"
                        ? "Offline · Draf lokal"
                        : "Belum diverifikasi"}
                  </span>
                </div>

                {sessionUser ? (
                  <UserAccountMenu
                    email={sessionUser.email}
                    image={sessionUser.image ?? null}
                    name={sessionUser.name}
                    role="RELAWAN"
                  />
                ) : (
                  <span className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    {ownerStatus === "loading" ? "Memeriksa…" : "Belum masuk"}
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Top Status Bars & Mobile Header (hidden on desktop) */}
          <header className="sticky top-0 z-30 lg:hidden">
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
                  className={`relative h-7 w-12 cursor-pointer rounded-full transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white ${simulatedOffline ? "bg-offline" : "bg-white/35"}`}
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
              <FieldBrand compact />
              {ownerStatus === "authenticated" && sessionUser ? (
                <div className="flex items-center gap-2">
                  <GlobalSearch />
                  <UserAccountMenu
                    email={sessionUser.email}
                    image={sessionUser.image ?? null}
                    name={sessionUser.name}
                    role="RELAWAN"
                  />
                </div>
              ) : (
                <span className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {ownerStatus === "signed-out"
                    ? "Belum masuk"
                    : ownerStatus === "loading"
                      ? "Memeriksa sesi"
                      : ownerStatus === "offline-known"
                        ? "Relawan offline"
                        : ownerStatus === "unavailable"
                          ? "Akun belum dikenal"
                          : "Akun relawan"}
                </span>
              )}
            </div>
          </header>

          {/* Notice banner */}
          {notice ? (
            <div
              className="fixed top-20 left-1/2 z-50 w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 lg:top-24"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-white p-4 text-sm shadow-xl">
                <p className="font-medium text-peat-forest">{notice}</p>
                <button
                  type="button"
                  className="min-h-9 shrink-0 cursor-pointer rounded-lg px-2 text-sm font-semibold text-peat-green hover:bg-peat-green/10"
                  aria-label="Tutup pemberitahuan"
                  onClick={() => setNotice("")}
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : null}

          {/* Main content */}
          <main className="mx-auto w-full max-w-[1600px] flex-1 pb-24 lg:p-7 lg:pb-12 xl:p-9">
            {children}
          </main>

          {/* Mobile bottom nav (hidden on desktop) */}
          <FieldBottomNav activeRoute={activeRoute} queueCount={queueCount} />
        </div>
      </div>
    </FieldShellContext.Provider>
  );
}
