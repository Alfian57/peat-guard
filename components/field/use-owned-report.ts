"use client";

import { useCallback, useEffect, useState } from "react";
import { useFieldShell } from "./field-app-shell";
import { getQueuedReport } from "@/lib/client/offline/report-store";
import type { QueuedFieldReport } from "@/lib/client/offline/types";

type OwnedReportSnapshot = {
  ownerId: string | null;
  reportId: string;
  report: QueuedFieldReport | null;
  loaded: boolean;
};

export function useOwnedReport(reportId: string) {
  const { ownerId, ownerStatus, setNotice } = useFieldShell();
  const [snapshot, setSnapshot] = useState<OwnedReportSnapshot>({
    ownerId: null,
    reportId,
    report: null,
    loaded: false,
  });

  const loadReport = useCallback(async () => {
    if (!ownerId) {
      setSnapshot({ ownerId: null, reportId, report: null, loaded: true });
      return null;
    }

    try {
      const report = await getQueuedReport(reportId, ownerId);
      setSnapshot({ ownerId, reportId, report, loaded: true });
      return report;
    } catch {
      setSnapshot({ ownerId, reportId, report: null, loaded: true });
      setNotice("Laporan lokal tidak dapat dibuka pada perangkat ini.");
      return null;
    }
  }, [ownerId, reportId, setNotice]);

  useEffect(() => {
    const timerId = window.setTimeout(() => void loadReport(), 0);
    return () => window.clearTimeout(timerId);
  }, [loadReport]);

  const snapshotMatches =
    snapshot.ownerId === ownerId && snapshot.reportId === reportId;
  return {
    ownerId,
    ownerStatus,
    report: snapshotMatches ? snapshot.report : null,
    isLoading: Boolean(ownerId && (!snapshotMatches || !snapshot.loaded)),
    loadReport,
  };
}
