"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  CommandError,
  CommandLoading,
} from "@/components/command/command-feedback";
import { CommandPageHeading } from "@/components/command/command-page-heading";
import {
  isReportListResponse,
  REPORT_STATUSES,
  type ReportListResponse,
  type ReportStatus,
} from "@/components/command/reports/report-contracts";
import {
  ReportQueueFilters,
  type ReportStatusCounts,
} from "@/components/command/reports/report-queue-filters";
import { ReportQueueResults } from "@/components/command/reports/report-queue-results";
import {
  buildReportQuery,
  type ReportFilters,
} from "@/components/command/reports/report-query";
import { COMMAND_API_ROUTES } from "@/components/command/routes";
import { isZonesResponse } from "@/components/command/command-api";
import { isRecord, requestCommandJson } from "@/components/command/command-api";
import type { CommandZone } from "@/lib/server/zones/data";

const PAGE_SIZE = 25;
const DEFAULT_FILTERS: ReportFilters = {
  status: null,
  zoneId: "",
  from: "",
  to: "",
  isDemoSample: "all",
};

type LoadState = "loading" | "ready" | "error";

export function ReportQueueScreen() {
  const [state, setState] = useState<LoadState>("loading");
  const [retryKey, setRetryKey] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<ReportFilters>(DEFAULT_FILTERS);
  const [filterError, setFilterError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [response, setResponse] = useState<ReportListResponse | null>(null);
  const [zones, setZones] = useState<CommandZone[]>([]);
  const [counts, setCounts] = useState<ReportStatusCounts>({
    all: null,
    [REPORT_STATUSES[0]]: null,
    [REPORT_STATUSES[1]]: null,
    [REPORT_STATUSES[2]]: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const requestOptions = {
      cache: "no-store",
      signal: controller.signal,
    } satisfies RequestInit;
    const allFilters = { ...filters, status: null };
    const reportRequest = requestCommandJson(
      COMMAND_API_ROUTES.reports +
        "?" +
        buildReportQuery(filters, page, PAGE_SIZE),
      requestOptions,
    );
    const countRequests = Promise.all([
      fetchReportCount(allFilters, null, requestOptions),
      ...REPORT_STATUSES.map((status) =>
        fetchReportCount(allFilters, status, requestOptions),
      ),
    ]);
    const zoneRequest = requestCommandJson(COMMAND_API_ROUTES.zones, {
      cache: "no-store",
      signal: controller.signal,
    });

    Promise.all([reportRequest, countRequests, zoneRequest])
      .then(([reportPayload, countValues, zonePayload]) => {
        if (!isReportListResponse(reportPayload)) {
          throw new Error("Daftar laporan dari server tidak sesuai format.");
        }
        if (!isZonesResponse(zonePayload)) {
          throw new Error("Daftar zona dari server tidak sesuai format.");
        }
        setResponse(reportPayload);
        setZones(zonePayload.zones);
        setCounts({
          all: countValues[0],
          [REPORT_STATUSES[0]]: countValues[1],
          [REPORT_STATUSES[1]]: countValues[2],
          [REPORT_STATUSES[2]]: countValues[3],
        });
        setLoadError("");
        setState("ready");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          cause instanceof Error
            ? cause.message
            : "Antrean laporan belum dapat dimuat.",
        );
        setState("error");
      });

    return () => controller.abort();
  }, [filters, page, retryKey]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilterError("");
    if (
      draftFilters.from &&
      draftFilters.to &&
      draftFilters.from > draftFilters.to
    ) {
      setFilterError("Tanggal awal tidak boleh setelah tanggal akhir.");
      return;
    }
    setState("loading");
    setPage(1);
    setFilters({ ...draftFilters, status: filters.status });
  }

  function changeStatus(status: ReportStatus | null) {
    setState("loading");
    setPage(1);
    setFilters((current) => ({ ...current, status }));
    setDraftFilters((current) => ({ ...current, status }));
  }

  function resetFilters() {
    setState("loading");
    setFilterError("");
    setPage(1);
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  }

  function retryLoad() {
    setState("loading");
    setLoadError("");
    setRetryKey((current) => current + 1);
  }

  const zoneNames = new Map(zones.map((zone) => [zone.id, zone.name]));

  return (
    <div>
      <CommandPageHeading
        description="Tinjau bukti lapangan, nilai urgensi AI, dan koordinasikan penanganan POSKO."
        eyebrow="POSKO · OPERASI"
        title="Daftar insiden"
      />
      <ReportQueueFilters
        counts={counts}
        draftFilters={draftFilters}
        error={filterError}
        isLoading={state === "loading"}
        onApply={applyFilters}
        onDraftChange={setDraftFilters}
        onReset={resetFilters}
        onStatusChange={changeStatus}
        selectedStatus={filters.status}
        zones={zones}
      />
      {state === "error" ? (
        <div className="mt-4">
          <CommandError message={loadError} onRetry={retryLoad} />
        </div>
      ) : null}
      <div className="mt-5">
        {state === "loading" ? (
          <CommandLoading label="Memuat antrean laporan…" />
        ) : state === "error" ? null : (
          <ReportQueueResults
            currentPage={page}
            isLoading={false}
            onPageChange={(nextPage) => {
              setState("loading");
              setPage(nextPage);
            }}
            onResetFilters={resetFilters}
            pageSize={PAGE_SIZE}
            response={response}
            zones={zoneNames}
          />
        )}
      </div>
    </div>
  );
}

async function fetchReportCount(
  filters: ReportFilters,
  status: ReportStatus | null,
  init: RequestInit,
): Promise<number> {
  const query = buildReportQuery({ ...filters, status }, 1, 1);
  const payload = await requestCommandJson(
    COMMAND_API_ROUTES.reports + "?" + query,
    init,
  );
  if (
    !isRecord(payload) ||
    typeof payload.total !== "number" ||
    !Number.isSafeInteger(payload.total) ||
    payload.total < 0
  ) {
    throw new Error("Jumlah laporan dari server tidak sesuai format.");
  }
  return payload.total;
}
