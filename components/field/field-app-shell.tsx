"use client";

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
import { FieldMobileHeader } from "./field-mobile-header";
import { fieldNavigationRoute } from "./field-navigation-state";
import { canUseDemoSamples as canUseLocalDemoSamples } from "@/lib/client/offline/demo-samples";
import {
  clearLastKnownOwner,
  getFieldAuthEvent,
  getLastKnownOwnerSnapshot,
  getServerOwnerSnapshot,
  isFieldRoleDenied,
  isFieldVolunteerRole,
  isSessionAuthDenied,
  persistLastKnownOwner,
  subscribeLastKnownOwner,
} from "@/lib/client/offline/owner-store";
import { listQueuedReports } from "@/lib/client/offline/report-store";
import { syncQueuedReports } from "@/lib/client/offline/sync-manager";
import { useFieldPwa, type FieldPwaState } from "./use-field-pwa";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  QueuedFieldReport,
  SyncSummary,
} from "@/lib/client/offline/types";

type FieldShellContextValue = {
  pwa: FieldPwaState;
  online: boolean;
  simulatedOffline: boolean;
  isConnected: boolean;
  ownerId: string | null;
  ownerStatus: FieldOwnerStatus;
  canUseDemoSamples: boolean;
  queueCount: number;
  syncRevision: number;
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

export function FieldAppShell({
  children,
  demoSamplesEnabled,
}: {
  children: ReactNode;
  demoSamplesEnabled: boolean;
}) {
  const pathname = usePathname();
  const pwa = useFieldPwa();
  const {
    data: session,
    isPending: isSessionPending,
    isRefetching: isSessionRefetching,
    error: sessionError,
    refetch: refetchSession,
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
  const authEvent = useSyncExternalStore(
    subscribeLastKnownOwner,
    getFieldAuthEvent,
    () => "",
  );
  const loggedOut = authEvent.startsWith("logout:");
  const [verifiedLogin, setVerifiedLogin] = useState<{
    event: string;
    ownerId: string;
  } | null>(null);

  const verifiedOwnerId =
    verifiedLogin?.event === authEvent ? verifiedLogin.ownerId : null;
  const sessionUserId = sessionUser?.id;
  const verifyLogin =
    online &&
    authEvent.startsWith("login:") &&
    !isSessionPending &&
    !isSessionRefetching &&
    isFieldVolunteerRole(sessionRole) &&
    Boolean(sessionUserId) &&
    verifiedOwnerId !== sessionUserId;

  useEffect(() => {
    if (!verifyLogin) return;
    let active = true;
    let timer: number | undefined;
    let delay = 1_000;
    async function verify() {
      try {
        const result = await authClient.getSession();
        if (!active || getFieldAuthEvent() !== authEvent) return;
        if (!result.error) {
          const user = result.data?.user;
          if (user && isFieldVolunteerRole(Reflect.get(user, "role"))) {
            setVerifiedLogin({ event: authEvent, ownerId: user.id });
          }
          if (user?.id !== sessionUserId) void refetchSession();
          return;
        }
        if (isSessionAuthDenied(result.error.status)) {
          void refetchSession();
          return;
        }
      } catch {
        // The auth request can fail while the browser still reports online.
      }
      if (!active || getFieldAuthEvent() !== authEvent) return;
      timer = window.setTimeout(verify, delay);
      delay = Math.min(delay * 2, 30_000);
    }
    void verify();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [authEvent, refetchSession, sessionUserId, verifyLogin]);

  const activeSessionOwnerId =
    !loggedOut &&
    (!authEvent || verifiedOwnerId === sessionUserId) &&
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
    !loggedOut &&
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
  const ownerStatus: FieldOwnerStatus = loggedOut
    ? "signed-out"
    : sessionRoleIsDenied || sessionIsForbidden
      ? "role-denied"
      : activeSessionOwnerId
        ? "authenticated"
        : ownerId
          ? "offline-known"
          : verifyLogin || isSessionPending || isSessionRefetching
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
  const [syncRevision, setSyncRevision] = useState(0);
  const syncControllerRef = useRef<AbortController | null>(null);
  const [lastSyncSummary, setLastSyncSummary] = useState<SyncSummary | null>(
    null,
  );
  const [notice, setNotice] = useState("");

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
      persistLastKnownOwner(activeSessionOwnerId, sessionRole, authEvent);
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
    authEvent,
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

  const canSync =
    isConnected &&
    ownerStatus === "authenticated" &&
    ownerId === activeSessionOwnerId;
  const hasQueuedReports = queueCount > 0;

  useEffect(() => {
    if (!canSync || !ownerId) return;
    const controller = new AbortController();
    syncControllerRef.current = controller;
    return () => {
      controller.abort();
      if (syncControllerRef.current === controller)
        syncControllerRef.current = null;
    };
  }, [authEvent, canSync, ownerId]);

  const performSync = useCallback(async () => {
    const controller = syncControllerRef.current;
    if (
      !controller ||
      controller.signal.aborted ||
      !ownerId ||
      getFieldAuthEvent() !== authEvent
    )
      return null;
    setIsSyncing(true);
    try {
      const summary = await syncQueuedReports(ownerId, {
        signal: controller.signal,
        onReportUpdated: (report) => {
          if (controller.signal.aborted || getFieldAuthEvent() !== authEvent)
            return;
          if (report.syncState === "synced")
            setSyncRevision((current) => current + 1);
        },
      });
      if (controller.signal.aborted) return null;
      setLastSyncSummary(summary);
      await refreshQueue();
      return summary;
    } catch {
      if (!controller.signal.aborted) {
        setNotice(
          "Sinkronisasi belum berhasil. Laporan tetap aman di perangkat.",
        );
      }
      return null;
    } finally {
      if (
        isMountedRef.current &&
        (!syncControllerRef.current || syncControllerRef.current === controller)
      ) {
        setIsSyncing(false);
      }
    }
  }, [
    authEvent,
    ownerId,
    refreshQueue,
    setIsSyncing,
    setLastSyncSummary,
    setNotice,
    setSyncRevision,
  ]);

  const syncNow = useCallback(async () => {
    if (!isConnected) {
      setNotice(
        "Laporan aman tersimpan di perangkat. Hubungkan kembali untuk sinkronisasi.",
      );
      return null;
    }
    if (!canSync) {
      setNotice("Masuk dengan akun relawan pemilik antrean sebelum mengirim.");
      return null;
    }
    setNotice("Menyinkronkan laporan ke posko…");
    const summary = await performSync();
    if (summary) {
      const attention = summary.failed + summary.requiresAuth;
      setNotice(
        attention
          ? `${summary.synced} terkirim, ${attention} masih perlu perhatian.`
          : summary.synced
            ? `${summary.synced} laporan berhasil dikirim ke posko.`
            : "Tidak ada laporan yang menunggu sinkronisasi.",
      );
    }
    return summary;
  }, [canSync, isConnected, performSync, setNotice]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshQueue(), 0);
    return () => window.clearTimeout(timer);
  }, [refreshQueue]);

  useEffect(() => {
    if (!canSync || !hasQueuedReports) return;
    let active = true;
    let delay = 2_000;
    let timer = window.setTimeout(attempt, 0);
    async function attempt() {
      const summary = await performSync();
      if (!active || !summary?.retryable || summary.requiresAuth) return;
      timer = window.setTimeout(attempt, delay);
      delay = Math.min(delay * 2, 60_000);
    }
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [canSync, hasQueuedReports, performSync]);

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
      pwa,
      online,
      simulatedOffline,
      isConnected,
      ownerId,
      ownerStatus,
      canUseDemoSamples,
      queueCount,
      syncRevision,
      isSyncing,
      lastSyncSummary,
      notice,
      setNotice,
      toggleSimulatedOffline,
      refreshQueue,
      syncNow,
    }),
    [
      pwa,
      isConnected,
      isSyncing,
      lastSyncSummary,
      notice,
      online,
      ownerId,
      ownerStatus,
      canUseDemoSamples,
      queueCount,
      syncRevision,
      refreshQueue,
      simulatedOffline,
      setNotice,
      syncNow,
      toggleSimulatedOffline,
    ],
  );

  const activeRoute = fieldNavigationRoute(pathname);

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
        <aside className="sidebar-scroll sticky top-0 z-30 hidden h-dvh w-72 shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
          <div className="flex h-18 shrink-0 items-center border-b border-sidebar-border px-6">
            <FieldBrand />
          </div>
          <div className="px-6 pt-6">
            <FieldNavigation pathname={pathname} queueCount={queueCount} />
          </div>
          <div className="mt-auto px-6 pt-6 pb-7">
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
          <header className="sticky top-0 z-20 hidden h-18 border-b border-[#e7e6dd] bg-[#fbfaf6]/90 backdrop-blur-xl lg:block">
            <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-9">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <GlobalSearch variant="bar" />
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {ownerStatus === "loading" ? (
                  <Skeleton
                    aria-hidden="true"
                    className="h-8 w-36 rounded-full bg-peat-forest/10 motion-reduce:animate-none"
                  />
                ) : (
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
                )}

                {ownerStatus === "loading" ? (
                  <div
                    className="flex h-10 items-center gap-2"
                    role="status"
                    aria-label="Memeriksa sesi relawan"
                  >
                    <Skeleton
                      aria-hidden="true"
                      className="size-9 rounded-full bg-peat-forest/10 motion-reduce:animate-none"
                    />
                    <div className="space-y-1" aria-hidden="true">
                      <Skeleton className="h-3 w-24 bg-peat-forest/10 motion-reduce:animate-none" />
                      <Skeleton className="h-2.5 w-28 bg-peat-forest/10 motion-reduce:animate-none" />
                    </div>
                  </div>
                ) : sessionUser ? (
                  <UserAccountMenu
                    email={sessionUser.email}
                    image={sessionUser.image ?? null}
                    name={sessionUser.name}
                    role="RELAWAN"
                  />
                ) : (
                  <span className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    Belum masuk
                  </span>
                )}
              </div>
            </div>
          </header>

          <FieldMobileHeader
            user={loggedOut ? null : sessionUser}
            connection={{
              isConnected,
              isSyncing,
              ownerStatus,
              queueCount,
              simulatedOffline,
              syncNow,
              toggleSimulatedOffline,
            }}
          />

          {/* Notice banner */}
          {notice ? (
            <div
              className="fixed top-28 left-1/2 z-50 w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 lg:top-24"
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
          <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-7 sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-7 xl:p-9">
            {children}
          </main>

          {/* Mobile bottom nav (hidden on desktop) */}
          <FieldBottomNav activeRoute={activeRoute} queueCount={queueCount} />
        </div>
      </div>
    </FieldShellContext.Provider>
  );
}
