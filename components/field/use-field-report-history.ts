"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFieldShell } from "./field-app-shell";
import {
  fetchServerReportPage,
  shouldFetchServerReports,
  type ServerReportSummary,
} from "@/lib/client/offline/server-report-client";
import { listQueuedReports } from "@/lib/client/offline/report-store";
import type { QueuedFieldReport } from "@/lib/client/offline/types";

type LocalReportSnapshot = {
  ownerId: string | null;
  reports: QueuedFieldReport[];
  loaded: boolean;
};

type ServerReportSnapshot = {
  ownerId: string | null;
  reports: ServerReportSummary[];
  page: number;
  pageSize: number;
  total: number;
  status: "loading" | "loaded" | "error";
  error: string | null;
};

export function useFieldReportHistory() {
  const {
    isConnected,
    ownerId,
    ownerStatus,
    queueCount,
    refreshQueue,
    setNotice,
  } = useFieldShell();
  const activeOwnerIdentityRef = useRef<{ ownerId: string | null } | null>(
    null,
  );
  useLayoutEffect(() => {
    const identity = { ownerId };
    activeOwnerIdentityRef.current = identity;
    return () => {
      if (activeOwnerIdentityRef.current === identity) {
        activeOwnerIdentityRef.current = null;
      }
    };
  }, [ownerId]);
  const [localSnapshot, setLocalSnapshot] = useState<LocalReportSnapshot>({
    ownerId: null,
    reports: [],
    loaded: false,
  });
  const [serverSnapshot, setServerSnapshot] = useState<ServerReportSnapshot>({
    ownerId: null,
    reports: [],
    page: 1,
    pageSize: 25,
    total: 0,
    status: "loading",
    error: null,
  });
  const [serverRefreshKey, setServerRefreshKey] = useState(0);
  const [pageSelection, setPageSelection] = useState({
    ownerId: null as string | null,
    page: 1,
  });

  const canFetchServerHistory = shouldFetchServerReports({
    ownerId,
    ownerStatus,
    isConnected,
  });
  const localReports =
    localSnapshot.ownerId === ownerId ? localSnapshot.reports : [];
  const isLoadingLocal = Boolean(
    ownerId && (localSnapshot.ownerId !== ownerId || !localSnapshot.loaded),
  );
  const serverPage = pageSelection.ownerId === ownerId ? pageSelection.page : 1;
  const serverSnapshotMatches =
    serverSnapshot.ownerId === ownerId && serverSnapshot.page === serverPage;
  const serverReports =
    canFetchServerHistory && serverSnapshotMatches
      ? serverSnapshot.reports
      : [];
  const serverStatus = canFetchServerHistory
    ? serverSnapshotMatches
      ? serverSnapshot.status
      : "loading"
    : "unavailable";
  const serverError =
    canFetchServerHistory && serverSnapshotMatches
      ? serverSnapshot.error
      : null;
  const serverTotal =
    canFetchServerHistory && serverSnapshotMatches ? serverSnapshot.total : 0;

  const loadLocalReports = useCallback(async () => {
    if (!ownerId) return;
    const identity = activeOwnerIdentityRef.current;
    if (!identity || identity.ownerId !== ownerId) return;
    try {
      const reports = await listQueuedReports(ownerId);
      if (activeOwnerIdentityRef.current !== identity) return;
      setLocalSnapshot({
        ownerId,
        reports,
        loaded: true,
      });
    } catch {
      if (activeOwnerIdentityRef.current !== identity) return;
      setLocalSnapshot({ ownerId, reports: [], loaded: true });
      setNotice(
        "Antrean lokal tidak dapat dibuka. Laporan tetap tersimpan, muat ulang halaman untuk mencoba lagi.",
      );
    }
  }, [ownerId, setNotice]);

  useEffect(() => {
    if (!ownerId) return;
    const identity = activeOwnerIdentityRef.current;
    if (!identity || identity.ownerId !== ownerId) return;
    let isActive = true;
    void listQueuedReports(ownerId)
      .then((reports) => {
        if (!isActive || activeOwnerIdentityRef.current !== identity) return;
        setLocalSnapshot({ ownerId, reports, loaded: true });
      })
      .catch(() => {
        if (!isActive || activeOwnerIdentityRef.current !== identity) return;
        setLocalSnapshot({ ownerId, reports: [], loaded: true });
        setNotice(
          "Antrean lokal tidak dapat dibuka. Laporan tetap tersimpan, muat ulang halaman untuk mencoba lagi.",
        );
      });
    return () => {
      isActive = false;
    };
  }, [ownerId, queueCount, setNotice]);

  useEffect(() => {
    if (!canFetchServerHistory || !ownerId) return;

    const controller = new AbortController();
    void fetchServerReportPage(controller.signal, serverPage)
      .then((page) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(page.total / page.pageSize));
        if (serverPage > lastPage) {
          setPageSelection({ ownerId, page: lastPage });
          return;
        }
        setServerSnapshot({
          ownerId,
          reports: page.reports,
          page: page.page,
          pageSize: page.pageSize,
          total: page.total,
          status: "loaded",
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setServerSnapshot({
          ownerId,
          reports: [],
          page: serverPage,
          pageSize: 25,
          total: 0,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Riwayat laporan server belum dapat dibuka.",
        });
      });
    return () => {
      controller.abort();
    };
  }, [canFetchServerHistory, ownerId, serverPage, serverRefreshKey]);

  const refreshServerHistory = useCallback(() => {
    if (!canFetchServerHistory) return;
    setServerSnapshot((current) =>
      current.ownerId === ownerId
        ? { ...current, status: "loading", error: null }
        : current,
    );
    setServerRefreshKey((key) => key + 1);
  }, [canFetchServerHistory, ownerId]);

  const refreshAll = useCallback(async () => {
    await loadLocalReports();
    await refreshQueue();
    refreshServerHistory();
  }, [loadLocalReports, refreshQueue, refreshServerHistory]);

  const navigateServerPage = useCallback(
    (page: number) => {
      if (page < 1 || !ownerId) return;
      setPageSelection({ ownerId, page });
    },
    [ownerId],
  );

  return {
    canFetchServerHistory,
    isConnected,
    isLoadingLocal,
    loadLocalReports,
    localReports,
    navigateServerPage,
    ownerId,
    refreshAll,
    refreshQueue,
    refreshServerHistory,
    serverError,
    serverReports,
    serverPage,
    serverPageSize: serverSnapshotMatches ? serverSnapshot.pageSize : 25,
    serverStatus,
    serverTotal,
  };
}
