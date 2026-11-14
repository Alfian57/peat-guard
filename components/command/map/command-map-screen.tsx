"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

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
import {
  startVisibleCommandMapPolling,
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
import { waterPointTypeLabel } from "@/lib/water-point-labels";

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
    setState((currentState) =>
      currentState === "ready" ? "ready" : "loading",
    );
    setError("");
    setRetryKey((current) => current + 1);
  }

  const refreshLiveData = useCallback(() => {
    setRetryKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    requestCommandJson(COMMAND_API_ROUTES.map, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((payload) => {
        if (controller.signal.aborted) return;
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
        setState((currentState) =>
          currentState === "ready" ? "ready" : "error",
        );
      });

    requestCommandJson(COMMAND_API_ROUTES.firms, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((payload) => {
        if (controller.signal.aborted) return;
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

    return startVisibleCommandMapPolling(visibilitySource, refreshLiveData, {
      setInterval: (callback, delayMs) => window.setInterval(callback, delayMs),
      clearInterval: (intervalId) => window.clearInterval(intervalId),
    });
  }, [refreshLiveData]);

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
      description: [waterPointTypeLabel(point.type), point.zoneName]
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
      buildReportMapQuery(current, DEFAULT_REPORT_MAP_FILTERS) ===
        buildReportMapQuery(viewport, DEFAULT_REPORT_MAP_FILTERS)
    ) {
      return;
    }

    reportViewportRef.current = viewport;
    setReportViewport(viewport);
    // Keep the last result during viewport refreshes. Replacing it with a
    // skeleton resizes the aligned map, emitting another viewport update.
    setReportMapState((currentState) =>
      currentState === "idle" ? "loading" : currentState,
    );
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
      return false;
    }

    commitReportFilters(draftReportFilters);
    return true;
  }

  function commitReportFilters(next: ReportMapFilters) {
    if (
      next.from === reportFilters.from &&
      next.to === reportFilters.to &&
      next.status === reportFilters.status &&
      next.urgency === reportFilters.urgency
    )
      return;
    setReportFilters(next);
    setReportMapResult(null);
    setReportMapState(reportViewport ? "loading" : "idle");
    setSelectedPoint(null);
  }

  function resetReportFilters() {
    setReportFiltersError("");
    setDraftReportFilters(DEFAULT_REPORT_MAP_FILTERS);
    commitReportFilters(DEFAULT_REPORT_MAP_FILTERS);
  }

  function discardReportFilterDraft() {
    setDraftReportFilters(reportFilters);
    setReportFiltersError("");
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
        description="Pantau zona gambut, sumber air, hotspot satelit, dan laporan lapangan di wilayah kerja."
        title="Peta komando"
      />

      <section
        aria-label="Peta komando dan layer"
        className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
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
          hotspotCount={data?.hotspots.length}
          onSync={() => void syncHotspots()}
          selectedPoint={selectedPoint}
          selectedZone={selectedZone}
          setShowHotspots={setShowHotspots}
          setShowWaterPoints={setShowWaterPoints}
          setShowZones={setShowZones}
          showHotspots={showHotspots}
          showWaterPoints={showWaterPoints}
          showZones={showZones}
          syncing={syncing}
          waterPointCount={data?.waterPoints.length}
          zoneCount={data?.zones.length}
          reportControls={{
            draftFilters: draftReportFilters,
            appliedFilters: reportFilters,
            error: reportMapError,
            filtersError: reportFiltersError,
            isVisible: showReports,
            limit: reportMapResult?.limit ?? null,
            loadState: reportMapState,
            onApply: applyReportFilters,
            onDiscardDraft: discardReportFilterDraft,
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
