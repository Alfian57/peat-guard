"use client";

import { useSyncExternalStore } from "react";
import { EditReport } from "./edit-report";
import { ReportDetail } from "./report-detail";

export function ReportWorkspace() {
  const search = useSyncExternalStore(
    subscribeToLocation,
    getLocationSearch,
    getServerLocationSearch,
  );
  const params = new URLSearchParams(search);
  const reportId = params.get("reportId") ?? "";
  const isEditing = params.get("mode") === "edit";

  // The URL only changes through a full navigation so the service worker can
  // return the cached shell while offline. No report data is put in server HTML.

  if (!reportId) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-8">
        <p className="rounded-xl border border-border bg-white p-4 text-sm">
          Tautan laporan tidak memuat ID lokal.
        </p>
        <a
          href="/field/home"
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-peat-green"
        >
          Kembali ke beranda
        </a>
      </div>
    );
  }

  return isEditing ? (
    <EditReport reportId={reportId} />
  ) : (
    <ReportDetail reportId={reportId} />
  );
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
