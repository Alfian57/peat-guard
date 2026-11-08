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
  fetchServerReportDetail,
  shouldFetchServerReports,
  type ServerReportDetail,
} from "@/lib/client/offline/server-report-client";

type ServerReportSnapshot = {
  ownerId: string | null;
  reportId: string;
  report: ServerReportDetail | null;
  error: string | null;
  status: "idle" | "loading" | "loaded" | "error";
};

const EMPTY_SNAPSHOT: ServerReportSnapshot = {
  ownerId: null,
  reportId: "",
  report: null,
  error: null,
  status: "idle",
};

export function useServerReport(reportId: string | null) {
  const { isConnected, ownerId, ownerStatus } = useFieldShell();
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
  const [snapshot, setSnapshot] =
    useState<ServerReportSnapshot>(EMPTY_SNAPSHOT);
  const canFetch = shouldFetchServerReports({
    ownerId,
    ownerStatus,
    isConnected,
  });

  const loadReport = useCallback(
    async (signal?: AbortSignal) => {
      if (!reportId || !canFetch) return null;
      const identity = activeIdentityRef.current;
      if (
        !identity ||
        identity.ownerId !== ownerId ||
        identity.reportId !== reportId
      ) {
        return null;
      }
      setSnapshot({
        ownerId,
        reportId,
        report: null,
        error: null,
        status: "loading",
      });
      try {
        const report = await fetchServerReportDetail(reportId, signal);
        if (signal?.aborted || activeIdentityRef.current !== identity) {
          return null;
        }
        setSnapshot({
          ownerId,
          reportId,
          report,
          error: null,
          status: "loaded",
        });
        return report;
      } catch (error) {
        if (signal?.aborted || activeIdentityRef.current !== identity) {
          return null;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Detail laporan server belum dapat dibuka.";
        setSnapshot({
          ownerId,
          reportId,
          report: null,
          error: message,
          status: "error",
        });
        return null;
      }
    },
    [canFetch, ownerId, reportId],
  );

  useEffect(() => {
    if (!reportId || !canFetch) return;
    const currentReportId = reportId;

    const controller = new AbortController();
    async function readReport() {
      try {
        const report = await fetchServerReportDetail(
          currentReportId,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          activeIdentityRef.current?.ownerId !== ownerId ||
          activeIdentityRef.current?.reportId !== currentReportId
        ) {
          return;
        }
        setSnapshot({
          ownerId,
          reportId: currentReportId,
          report,
          error: null,
          status: "loaded",
        });
      } catch (error) {
        if (
          controller.signal.aborted ||
          activeIdentityRef.current?.ownerId !== ownerId ||
          activeIdentityRef.current?.reportId !== currentReportId
        ) {
          return;
        }
        setSnapshot({
          ownerId,
          reportId: currentReportId,
          report: null,
          error:
            error instanceof Error
              ? error.message
              : "Detail laporan server belum dapat dibuka.",
          status: "error",
        });
      }
    }

    void readReport();
    return () => controller.abort();
  }, [canFetch, ownerId, reportId]);

  const matchesOwnerAndReport =
    snapshot.ownerId === ownerId && snapshot.reportId === reportId;
  const status = matchesOwnerAndReport
    ? snapshot.status
    : canFetch && reportId
      ? "loading"
      : "idle";

  return {
    report: matchesOwnerAndReport ? snapshot.report : null,
    error: matchesOwnerAndReport ? snapshot.error : null,
    status,
    loadReport,
  };
}
