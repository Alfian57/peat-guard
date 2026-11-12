"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Satellite } from "lucide-react";

import { CommandPageHeading } from "@/components/command/command-page-heading";
import {
  CommandRequestError,
  isCommandMapData,
  isFirmsSyncStatus,
  requestCommandJson,
  type CommandMapData,
  type FirmsSyncStatus,
} from "@/components/command/command-api";
import { COMMAND_API_ROUTES } from "@/components/command/routes";
import { CommandMapFrame } from "@/components/command/map/command-map-frame";
import { CommandMapSidePanel } from "@/components/command/map/command-map-side-panel";
import { MapSummaryGrid } from "@/components/command/map/map-summary-grid";
import {
  startVisibleReportMapPolling,
  type VisibilitySource,
} from "@/components/command/map/report-map-polling";
import { toCommandReportMapPoint } from "@/components/command/map/report-map-point";
import { type ReportMapLoadState } from "@/components/command/map/report-map-controls";
import {
  isReportMapPointsResponse,
  type ReportMapPointsResponse,
} from "@/components/command/reports/report-contracts";
import {
  buildReportMapQuery,
  DEFAULT_REPORT_MAP_FILTERS,
  type ReportMapFilters,
} from "@/components/command/reports/report-map-query";
import type { MapPoint, MapViewport, MapZone } from "@/lib/maps/types";

type LoadState = "loading" | "ready" | "error";

export function CommandMapScreen() {
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<CommandMapData | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState("");
  const [firmsStatus, setFirmsStatus] = useState<FirmsSyncStatus | null>(null);
  const [firmsError, setFirmsError] = useState("");
  const [firmsNotice, setFirmsNotice] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [showWaterPoints, setShowWaterPoints] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [reportViewport, setReportViewport] = useState<MapViewport | null>(
    null,
  );
  const reportViewportRef = useRef<MapViewport | null>(null);
  const [reportMapState, setReportMapState] =
    useState<ReportMapLoadState>("idle");
  const [reportMapResult, setReportMapResult] =
    useState<ReportMapPointsResponse | null>(null);
  const [reportMapError, setReportMapError] = useState("");
  const [reportRetryKey, setReportRetryKey] = useState(0);
  const refreshReportPoints = useCallback(() => {
    setReportRetryKey((current) => current + 1);
  }, []);
  const [reportFilters, setReportFilters] = useState<ReportMapFilters>(
    DEFAULT_REPORT_MAP_FILTERS,
  );
  const [draftReportFilters, setDraftReportFilters] =
    useState<ReportMapFilters>(DEFAULT_REPORT_MAP_FILTERS);
  const [reportFiltersError, setReportFiltersError] = useState("");

  function refreshMap() {
    setState("loading");
    setError("");
    setRetryKey((current) => current + 1);
  }

  useEffect(() => {
    const controller = new AbortController();

    requestCommandJson(COMMAND_API_ROUTES.map, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((payload) => {
        if (!isCommandMapData(payload)) {
          throw new CommandRequestError(
            "Data peta dari server tidak sesuai format.",
          );
        }
        setData(payload);
        setState("ready");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Peta belum dapat dimuat. Coba kembali.",
        );
        setState("error");
      });

    requestCommandJson(COMMAND_API_ROUTES.firms, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((payload) => {
        if (!isFirmsSyncStatus(payload)) {
          throw new CommandRequestError(
            "Status NASA FIRMS tidak sesuai format.",
          );
        }
        setFirmsStatus(payload);
        setFirmsError("");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setFirmsError(
          cause instanceof Error
            ? cause.message
            : "Status NASA FIRMS tidak tersedia.",
        );
      });

    return () => controller.abort();
  }, [retryKey]);

  useEffect(() => {
    if (!reportViewport || !showReports) return;

    const controller = new AbortController();
    const query = buildReportMapQuery(reportViewport, reportFilters);
    const timer = window.setTimeout(() => {
      requestCommandJson(COMMAND_API_ROUTES.reportMapPoints + "?" + query, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then((payload) => {
          if (controller.signal.aborted) return;
          if (!isReportMapPointsResponse(payload)) {
            throw new CommandRequestError(
              "Data laporan pada peta tidak sesuai format.",
            );
          }
          setReportMapResult(payload);
          setReportMapError("");
          setReportMapState("ready");
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          setReportMapError(
            cause instanceof Error
              ? cause.message
              : "Laporan pada area peta belum dapat dimuat.",
          );
          setReportMapState("error");
        });
    }, 160);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [reportFilters, reportRetryKey, reportViewport, showReports]);

  useEffect(() => {
    if (!reportViewport || !showReports) return;

    const visibilitySource: VisibilitySource = {
      get visibilityState() {
        return document.visibilityState;
      },
      addVisibilityChangeListener(listener) {
        document.addEventListener("visibilitychange", listener);
      },
      removeVisibilityChangeListener(listener) {
        document.removeEventListener("visibilitychange", listener);
      },
    };

    return startVisibleReportMapPolling(visibilitySource, refreshReportPoints, {
      setInterval: (callback, delayMs) => window.setInterval(callback, delayMs),
      clearInterval: (intervalId) => window.clearInterval(intervalId),
    });
  }, [refreshReportPoints, reportViewport, showReports]);

  const mapZones = useMemo<MapZone[]>(
    () =>
      (data?.zones ?? []).map((zone) => ({
        id: zone.id,
        name: zone.name,
        areaHectares: zone.areaHectares,
        geometry: zone.geometry,
        isDemoData: zone.isDemoData,
      })),
    [data?.zones],
  );
  const mapPoints = useMemo<MapPoint[]>(() => {
    const waterPoints: MapPoint[] = (data?.waterPoints ?? []).map((point) => ({
      id: point.id,
      coordinates: [point.longitude, point.latitude],
      kind: "water",
      label: point.name,
      description: [point.type.replaceAll("_", " "), point.zoneName]
        .filter(Boolean)
        .join(" · "),
      isDemoData: point.isDemoData,
    }));
    return [...(data?.hotspots ?? []), ...waterPoints];
  }, [data?.hotspots, data?.waterPoints]);
  const reportPoints = useMemo<MapPoint[]>(
    () => (reportMapResult?.points ?? []).map(toCommandReportMapPoint),
    [reportMapResult?.points],
  );
  const visibleZones = showZones ? mapZones : [];
  const visiblePoints = [
    ...mapPoints.filter((point) =>
      point.kind === "water" ? showWaterPoints : showHotspots,
    ),
    ...(showReports ? reportPoints : []),
  ];

  function updateReportViewport(viewport: MapViewport) {
    const current = reportViewportRef.current;
    if (
      current &&
      current.west === viewport.west &&
      current.south === viewport.south &&
      current.east === viewport.east &&
      current.north === viewport.north
    ) {
      return;
    }

    reportViewportRef.current = viewport;
    setReportViewport(viewport);
    setReportMapResult(null);
    setReportMapState("loading");
    setSelectedPoint(null);
  }

  function applyReportFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReportFiltersError("");
    if (
      draftReportFilters.from &&
      draftReportFilters.to &&
      draftReportFilters.from > draftReportFilters.to
    ) {
      setReportFiltersError("Tanggal awal tidak boleh setelah tanggal akhir.");
      return;
    }

    setReportFilters(draftReportFilters);
    setReportMapResult(null);
    setReportMapState(reportViewport ? "loading" : "idle");
    setSelectedPoint(null);
  }

  function resetReportFilters() {
    setReportFiltersError("");
    setDraftReportFilters(DEFAULT_REPORT_MAP_FILTERS);
    setReportFilters(DEFAULT_REPORT_MAP_FILTERS);
    setReportMapResult(null);
    setReportMapState(reportViewport ? "loading" : "idle");
    setSelectedPoint(null);
  }

  function retryReportPoints() {
    setReportMapError("");
    setReportMapResult(null);
    setReportMapState(reportViewport ? "loading" : "idle");
    setReportRetryKey((current) => current + 1);
  }

  async function syncHotspots() {
    setSyncing(true);
    setFirmsError("");
    setFirmsNotice("");
    try {
      await requestCommandJson(COMMAND_API_ROUTES.firmsSync, {
        method: "POST",
      });
      refreshMap();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Sinkronisasi hotspot gagal.";
      if (cause instanceof CommandRequestError && cause.status === 429) {
        setFirmsNotice(message);
      } else {
        setFirmsError(message);
      }
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <CommandPageHeading
        action={
          <button
            className="inline-flex h-8 min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-peat-forest px-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-70"
            disabled={syncing || firmsStatus?.configured === false}
            onClick={() => void syncHotspots()}
            type="button"
          >
            <Satellite aria-hidden="true" size={14} />
            {syncing ? "Menyinkronkan…" : "Sinkronkan NASA FIRMS"}
          </button>
        }
        description="Pantau zona gambut, titik sumber air, dan indikasi hotspot satelit di wilayah kerja."
        title="Peta komando"
      />

      <MapSummaryGrid
        hotspotCount={data?.hotspots.length}
        reportCount={reportMapResult?.points.length}
        reportTruncated={reportMapResult?.truncated ?? false}
        waterPointCount={data?.waterPoints.length}
        zoneCount={data?.zones.length}
      />

      <section
        aria-label="Peta komando dan layer"
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]"
      >
        <CommandMapFrame
          error={error}
          onPointSelect={(point) => {
            setSelectedPoint(point);
            setSelectedZone(null);
          }}
          onRetry={refreshMap}
          onViewportChange={updateReportViewport}
          onZoneSelect={(zone) => {
            setSelectedZone(zone);
            setSelectedPoint(null);
          }}
          points={visiblePoints}
          state={state}
          zones={visibleZones}
        />
        <CommandMapSidePanel
          firmsError={firmsError}
          firmsNotice={firmsNotice}
          firmsStatus={firmsStatus}
          selectedPoint={selectedPoint}
          selectedZone={selectedZone}
          setShowHotspots={setShowHotspots}
          setShowWaterPoints={setShowWaterPoints}
          setShowZones={setShowZones}
          showHotspots={showHotspots}
          showWaterPoints={showWaterPoints}
          showZones={showZones}
          reportControls={{
            draftFilters: draftReportFilters,
            error: reportMapError,
            filtersError: reportFiltersError,
            isVisible: showReports,
            limit: reportMapResult?.limit ?? null,
            loadState: reportMapState,
            onApply: applyReportFilters,
            onDraftChange: setDraftReportFilters,
            onReset: resetReportFilters,
            onRetry: retryReportPoints,
            onVisibilityChange: setShowReports,
            pointCount: reportMapResult?.points.length,
            truncated: reportMapResult?.truncated ?? false,
          }}
        />
      </section>
    </div>
  );
}
