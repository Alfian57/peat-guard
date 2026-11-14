"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CommandError } from "@/components/command/command-feedback";
import { ReportQueueSkeleton } from "@/components/command/reports/report-queue-skeleton";
import { CommandPageHeading } from "@/components/command/command-page-heading";
import {
  isReportListResponse,
  type ReportListResponse,
} from "@/components/command/reports/report-contracts";
import { ReportQueueFilters } from "@/components/command/reports/report-queue-filters";
import { ReportQueueResults } from "@/components/command/reports/report-queue-results";
import {
  buildPageHref,
  buildReportQuery,
  buildReportQueueHref,
  DEFAULT_REPORT_FILTERS,
  parseReportQueryParams,
  type ReportFilters,
} from "@/components/command/reports/report-query";
import { COMMAND_API_ROUTES } from "@/components/command/routes";
import { isZonesResponse } from "@/components/command/command-api";
import { requestCommandJson } from "@/components/command/command-api";
import { APP_ROUTES } from "@/lib/routes";
import type { CommandZone } from "@/lib/server/zones/data";

const PAGE_SIZE = 25;

export function ReportQueueScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlParams = useMemo(
    () => parseReportQueryParams(searchParams),
    [searchParams],
  );

  const page = urlParams.page;
  const filters = urlParams.filters;

  const [draftFilters, setDraftFilters] = useState<ReportFilters>(
    urlParams.filters,
  );
  const [syncedParams, setSyncedParams] = useState(searchParams);
  if (syncedParams !== searchParams) {
    setSyncedParams(searchParams);
    setDraftFilters(urlParams.filters);
  }

  const [filterError, setFilterError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [response, setResponse] = useState<ReportListResponse | null>(null);
  const [zones, setZones] = useState<CommandZone[]>([]);
  const [retryKey, setRetryKey] = useState(0);

  const currentKey = `${JSON.stringify(filters)}-${page}-${retryKey}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isLoading = loadedKey !== currentKey;
  const isError = Boolean(loadError) && !isLoading;

  useEffect(() => {
    const controller = new AbortController();
    const requestOptions = {
      cache: "no-store",
      signal: controller.signal,
    } satisfies RequestInit;

    const reportRequest = requestCommandJson(
      COMMAND_API_ROUTES.reports +
        "?" +
        buildReportQuery(filters, page, PAGE_SIZE),
      requestOptions,
    );
    const zoneRequest = requestCommandJson(COMMAND_API_ROUTES.zones, {
      cache: "no-store",
      signal: controller.signal,
    });

    Promise.all([reportRequest, zoneRequest])
      .then(([reportPayload, zonePayload]) => {
        if (!isReportListResponse(reportPayload)) {
          throw new Error("Daftar laporan dari server tidak sesuai format.");
        }
        if (!isZonesResponse(zonePayload)) {
          throw new Error("Daftar zona dari server tidak sesuai format.");
        }
        setResponse(reportPayload);
        setZones(zonePayload.zones);
        setLoadError("");
        setLoadedKey(currentKey);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          cause instanceof Error
            ? cause.message
            : "Antrean laporan belum dapat dimuat.",
        );
        setLoadedKey(currentKey);
      });

    return () => controller.abort();
  }, [currentKey, filters, page, retryKey]);

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
    const href = buildReportQueueHref(draftFilters, 1);
    router.push(href, { scroll: false });
  }

  function handlePageChange(nextPage: number) {
    const href = buildPageHref(filters, nextPage);
    router.push(href, { scroll: false });
  }

  function resetFilters() {
    setFilterError("");
    setDraftFilters(DEFAULT_REPORT_FILTERS);
    router.push(APP_ROUTES.command.reports, { scroll: false });
  }

  function resetAll() {
    setFilterError("");
    setDraftFilters(DEFAULT_REPORT_FILTERS);
    router.push(APP_ROUTES.command.reports, { scroll: false });
  }

  function retryLoad() {
    setLoadError("");
    setRetryKey((current) => current + 1);
  }

  const zoneNames = new Map(zones.map((zone) => [zone.id, zone.name]));

  return (
    <div>
      <CommandPageHeading
        description="Tinjau bukti lapangan, nilai urgensi AI, dan koordinasikan penanganan POSKO."
        title="Antrean laporan"
      />
      <ReportQueueFilters
        draftFilters={draftFilters}
        error={filterError}
        isLoading={isLoading}
        onApply={applyFilters}
        onDraftChange={setDraftFilters}
        onReset={resetFilters}
        resetFiltersHref={APP_ROUTES.command.reports}
        zones={zones}
      />
      {isError ? (
        <div className="mt-4">
          <CommandError message={loadError} onRetry={retryLoad} />
        </div>
      ) : null}
      <div className="mt-5">
        {isLoading ? (
          <ReportQueueSkeleton />
        ) : isError ? null : (
          <ReportQueueResults
            currentPage={page}
            filters={filters}
            isLoading={false}
            onPageChange={handlePageChange}
            onResetFilters={resetAll}
            pageSize={PAGE_SIZE}
            resetHref={APP_ROUTES.command.reports}
            response={response}
            zones={zoneNames}
          />
        )}
      </div>
    </div>
  );
}
