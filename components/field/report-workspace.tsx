"use client";

import { useSyncExternalStore } from "react";
import { EditReport } from "./edit-report";
import { ReportDetail } from "./report-detail";
import { APP_ROUTES } from "@/lib/routes";

export function ReportWorkspace() {
  const search = useSyncExternalStore(
    subscribeToLocation,
    getLocationSearch,
    getServerLocationSearch,
  );
  const params = new URLSearchParams(search);
  const reportId = params.get("reportId");
  const serverReportId = params.get("serverReportId");
  const isEditing = params.get("mode") === "edit";

  // The URL only changes through a full navigation so the service worker can
  // return the cached shell while offline. No report data is put in server HTML.

  if (!reportId && !serverReportId) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-8">
        <p className="rounded-xl border border-border bg-white p-4 text-sm">
          Tautan laporan tidak memuat ID laporan.
        </p>
        <a
          href={APP_ROUTES.field.home}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-peat-green"
        >
          Kembali ke beranda
        </a>
      </div>
    );
  }

  if (isEditing && reportId) {
    return <EditReport reportId={reportId} />;
  }

  return <ReportDetail reportId={reportId} serverReportId={serverReportId} />;
}

function subscribeToLocation() {
  return () => undefined;
}

function getLocationSearch() {
  return window.location.search;
}

function getServerLocationSearch() {
  return "";
}
