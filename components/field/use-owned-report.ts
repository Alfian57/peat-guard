"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useFieldShell } from "./field-app-shell";
import { getQueuedReport } from "@/lib/client/offline/report-store";
import type { QueuedFieldReport } from "@/lib/client/offline/types";

type OwnedReportSnapshot = {
  ownerId: string | null;
  reportId: string | null;
  report: QueuedFieldReport | null;
  loaded: boolean;
};

export function useOwnedReport(reportId: string | null) {
  const { isSyncing, ownerId, ownerStatus, queueCount, setNotice } =
    useFieldShell();
  const activeIdentityRef = useRef<{
    ownerId: string | null;
    reportId: string | null;
  } | null>(null);
  useLayoutEffect(() => {
    const identity = { ownerId, reportId };
    activeIdentityRef.current = identity;
    return () => {
      if (activeIdentityRef.current === identity) {
        activeIdentityRef.current = null;
      }
    };
  }, [ownerId, reportId]);
  const [snapshot, setSnapshot] = useState<OwnedReportSnapshot>({
    ownerId: null,
    reportId,
    report: null,
    loaded: false,
  });

  const loadReport = useCallback(async () => {
    if (!ownerId || !reportId) {
      return null;
    }
    const identity = activeIdentityRef.current;
    if (
      !identity ||
      identity.ownerId !== ownerId ||
      identity.reportId !== reportId
    ) {
      return null;
    }

    try {
      const report = await getQueuedReport(reportId, ownerId);
      if (activeIdentityRef.current !== identity) return null;
      setSnapshot({ ownerId, reportId, report, loaded: true });
      return report;
    } catch {
      if (activeIdentityRef.current !== identity) return null;
      setSnapshot({ ownerId, reportId, report: null, loaded: true });
      setNotice("Laporan lokal tidak dapat dibuka pada perangkat ini.");
      return null;
    }
  }, [ownerId, reportId, setNotice]);

  useEffect(() => {
    if (!ownerId || !reportId) return;
    const identity = activeIdentityRef.current;
    if (
      !identity ||
      identity.ownerId !== ownerId ||
      identity.reportId !== reportId
    ) {
      return;
    }
    let isActive = true;
    void getQueuedReport(reportId, ownerId)
      .then((report) => {
        if (!isActive || activeIdentityRef.current !== identity) return;
        setSnapshot({ ownerId, reportId, report, loaded: true });
      })
      .catch(() => {
        if (!isActive || activeIdentityRef.current !== identity) return;
        setSnapshot({ ownerId, reportId, report: null, loaded: true });
        setNotice("Laporan lokal tidak dapat dibuka pada perangkat ini.");
      });
    return () => {
      isActive = false;
    };
  }, [isSyncing, ownerId, queueCount, reportId, setNotice]);

  const snapshotMatches =
    snapshot.ownerId === ownerId && snapshot.reportId === reportId;
  return {
    ownerId,
    ownerStatus,
    report: snapshotMatches ? snapshot.report : null,
    isLoading: Boolean(
      ownerId && reportId && (!snapshotMatches || !snapshot.loaded),
    ),
    loadReport,
  };
}
