"use client";

import { API_ROUTES } from "@/lib/routes";
import type { listCarbonParameters } from "@/lib/server/mrv/parameters";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CommandError } from "@/components/command/command-feedback";
import { ZoneEditorSkeleton } from "@/components/command/zones/zone-editor-skeleton";
import { CommandPageHeading } from "@/components/command/command-page-heading";
import {
  isCommandMapData,
  isZoneResponse,
  requestCommandJson,
} from "@/components/command/command-api";
import {
  COMMAND_API_ROUTES,
  COMMAND_ROUTES,
  zoneApiRoute,
  zoneEditRoute,
} from "@/components/command/routes";
import { ZoneApprovalResetDialog } from "@/components/command/zones/zone-approval-reset-dialog";
import { ZoneEditorForm } from "@/components/command/zones/zone-editor-form";
import { ZoneBoundaryControls } from "@/components/command/zones/zone-boundary-controls";
import { ZoneMapPanel } from "@/components/command/zones/zone-map-panel";
import { toast } from "@/components/ui/toast";
import { polygonFromVertices } from "@/components/command/zones/zone-geometry";
import type { CommandMapData } from "@/components/command/command-api";
import type { MapPoint, MapZone } from "@/lib/maps/types";
import type { CommandZone } from "@/lib/server/zones/data";
import type { ZonePolygon } from "@/lib/server/zones/validation";

type ScreenState = "loading" | "ready" | "error";

export function ZoneEditorScreen({ zoneId }: { zoneId?: string }) {
  const router = useRouter();
  const isCreate = zoneId === undefined;
  const [screenState, setScreenState] = useState<ScreenState>(
    isCreate ? "ready" : "loading",
  );
  const [retryKey, setRetryKey] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [mapError, setMapError] = useState("");
  const [mapData, setMapData] = useState<CommandMapData | null>(null);
  const [parameters, setParameters] = useState<
    Awaited<ReturnType<typeof listCarbonParameters>>
  >([]);
  const [parameterId, setParameterId] = useState("");
  const [parameterError, setParameterError] = useState("");
  const [zone, setZone] = useState<CommandZone | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [villageName, setVillageName] = useState("");
  const [peatDepth, setPeatDepth] = useState("1.5");
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const [innerRings, setInnerRings] = useState<ZonePolygon["coordinates"]>([]);
  const geometry = useMemo(() => {
    const outer = polygonFromVertices(vertices);
    return outer
      ? { ...outer, coordinates: [...outer.coordinates, ...innerRings] }
      : null;
  }, [innerRings, vertices]);
  const [drawBoundary, setDrawBoundary] = useState(false);
  const [movingVertex, setMovingVertex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [confirmApprovalReset, setConfirmApprovalReset] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void requestCommandJson(API_ROUTES.command.mrvParameters, {
      signal: controller.signal,
    })
      .then((value) => {
        if (controller.signal.aborted) return;
        if (
          !value ||
          typeof value !== "object" ||
          !("parameters" in value) ||
          !Array.isArray(value.parameters)
        ) {
          throw new Error("Respons parameter tidak valid.");
        }
        setParameters(value.parameters);
        setParameterError("");
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setParameterError("Versi parameter belum dapat dimuat.");
      });
    const mapRequest = requestCommandJson(COMMAND_API_ROUTES.map, {
      cache: "no-store",
      signal: controller.signal,
    });
    const zoneRequest = zoneId
      ? requestCommandJson(zoneApiRoute(zoneId), {
          cache: "no-store",
          signal: controller.signal,
        })
      : Promise.resolve(null);
    Promise.allSettled([mapRequest, zoneRequest]).then(
      ([mapResult, zoneResult]) => {
        if (controller.signal.aborted) return;
        if (
          mapResult.status === "fulfilled" &&
          isCommandMapData(mapResult.value)
        ) {
          setMapData(mapResult.value);
          setMapError("");
        } else {
          setMapData(null);
          setMapError(
            mapResult.status === "rejected"
              ? mapResult.reason instanceof Error
                ? mapResult.reason.message
                : "Data peta belum tersedia."
              : "Data peta dari server tidak sesuai format.",
          );
        }

        if (!zoneId) return;
        if (
          zoneResult.status === "fulfilled" &&
          isZoneResponse(zoneResult.value)
        ) {
          const currentZone = zoneResult.value.zone;
          setZone(currentZone);
          setParameterId(currentZone.carbonParameterSetId ?? "");
          setZoneName(currentZone.name);
          setVillageName(currentZone.villageName ?? "");
          setPeatDepth(String(currentZone.peatDepthMeters));
          setVertices(currentZone.geometry.coordinates[0].slice(0, -1));
          setInnerRings(currentZone.geometry.coordinates.slice(1));
          setLoadError("");
          setScreenState("ready");
        } else {
          setLoadError(
            zoneResult.status === "rejected"
              ? zoneResult.reason instanceof Error
                ? zoneResult.reason.message
                : "Zona belum dapat dimuat."
              : "Data zona dari server tidak sesuai format.",
          );
          setScreenState("error");
        }
      },
    );
    return () => controller.abort();
  }, [retryKey, zoneId]);

  function retryLoad() {
    setMapError("");
    setLoadError("");
    if (!isCreate) setScreenState("loading");
    setRetryKey((current) => current + 1);
  }

  const mapZones = useMemo<MapZone[]>(() => {
    const existingZones = (mapData?.zones ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      areaHectares: item.areaHectares,
      geometry: item.geometry,
      isDemoData: item.isDemoData,
    }));

    if (!geometry) return existingZones.filter((item) => item.id !== zoneId);

    const preview: MapZone = {
      id: "draft-" + (zoneId ?? "new"),
      name: zoneName || "Batas zona baru",
      areaHectares: zone?.areaHectares ?? 0,
      geometry,
    };
    return [...existingZones.filter((item) => item.id !== zoneId), preview];
  }, [geometry, mapData?.zones, zone?.areaHectares, zoneId, zoneName]);
  const mapPoints = useMemo<MapPoint[]>(() => {
    const waterPoints: MapPoint[] = (mapData?.waterPoints ?? []).map(
      (point) => ({
        id: point.id,
        coordinates: [point.longitude, point.latitude],
        kind: "water",
        label: point.name,
        description: point.zoneName ?? "Titik sumber air",
        isDemoData: point.isDemoData,
      }),
    );
    return [...waterPoints, ...(mapData?.hotspots ?? [])];
  }, [mapData?.hotspots, mapData?.waterPoints]);
  const approvalSensitiveChange = Boolean(
    zone?.isApproved &&
    (Number(peatDepth) !== zone.peatDepthMeters ||
      Boolean(parameterId && parameterId !== zone.carbonParameterSetId) ||
      JSON.stringify(geometry) !== JSON.stringify(zone.geometry)),
  );

  function handleMapClick(coordinates: [number, number]) {
    const rounded: [number, number] = [
      Number(coordinates[0].toFixed(6)),
      Number(coordinates[1].toFixed(6)),
    ];

    if (movingVertex !== null) {
      setVertices((current) =>
        current.map((point, index) =>
          index === movingVertex ? rounded : point,
        ),
      );
      setMovingVertex(null);
      setSavedMessage("");
    } else if (drawBoundary) {
      setVertices((current) => [...current, rounded]);
      setSavedMessage("");
    }
  }

  async function saveZone(confirmReset = false) {
    setFormError("");
    setSavedMessage("");

    if (!zoneName.trim() || zoneName.trim().length > 150) {
      setFormError("Nama zona wajib diisi dan maksimal 150 karakter.");
      return;
    }
    if (villageName.trim().length > 100) {
      setFormError("Nama desa maksimal 100 karakter.");
      return;
    }

    const depth = Number(peatDepth);
    if (!Number.isFinite(depth) || depth < 0 || depth > 20) {
      setFormError("Kedalaman gambut harus berada di antara 0 dan 20 meter.");
      return;
    }
    if (!geometry || geometry.coordinates[0].length < 4) {
      setFormError("Gambar batas zona dengan sedikitnya tiga titik pada peta.");
      return;
    }
    if (approvalSensitiveChange && !confirmReset) {
      setConfirmApprovalReset(true);
      return;
    }

    const payload: Record<string, unknown> = {};
    if (isCreate || zoneName.trim() !== zone?.name)
      payload.zoneName = zoneName.trim();
    const village = villageName.trim() || null;
    if (isCreate || village !== zone?.villageName)
      payload.villageName = village;
    if (isCreate || depth !== zone?.peatDepthMeters)
      payload.peatDepthMeters = depth;
    if (isCreate || JSON.stringify(geometry) !== JSON.stringify(zone?.geometry))
      payload.geometry = geometry;
    if (parameterId && (isCreate || parameterId !== zone?.carbonParameterSetId))
      payload.carbonParameterSetId = parameterId;
    if (!isCreate && Object.keys(payload).length === 0) {
      setSavedMessage("Tidak ada perubahan untuk disimpan.");
      return;
    }

    if (zone?.reviewRevision !== undefined)
      payload.expectedRevision = zone.reviewRevision;
    setIsSaving(true);
    try {
      const result = await requestCommandJson(
        isCreate ? COMMAND_API_ROUTES.zones : zoneApiRoute(zoneId),
        {
          method: isCreate ? "POST" : "PATCH",
          body: JSON.stringify(payload),
        },
      );
      if (!isZoneResponse(result)) {
        throw new Error("Respons zona dari server tidak sesuai format.");
      }

      const savedZone = result.zone;
      setZone(savedZone);
      setParameterId(savedZone.carbonParameterSetId ?? "");
      setZoneName(savedZone.name);
      setVillageName(savedZone.villageName ?? "");
      setPeatDepth(String(savedZone.peatDepthMeters));
      setVertices(savedZone.geometry.coordinates[0].slice(0, -1));
      setInnerRings(savedZone.geometry.coordinates.slice(1));
      const area = new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 2,
      }).format(savedZone.areaHectares);
      setSavedMessage(
        (isCreate ? "Zona dibuat" : "Perubahan tersimpan") +
          ". Luas hasil perhitungan server: " +
          area +
          " ha.",
      );
      toast.success(
        isCreate ? "Zona dibuat" : "Zona diperbarui",
        isCreate
          ? `Zona ${savedZone.name} berhasil dibuat (${area} ha).`
          : `Perubahan zona ${savedZone.name} berhasil disimpan (${area} ha).`,
      );
      if (isCreate) {
        router.replace(zoneEditRoute(savedZone.id));
      } else if (approvalSensitiveChange) {
        setSavedMessage(
          "Perubahan tersimpan. Persetujuan zona dicabut otomatis. Luas hasil perhitungan server: " +
            area +
            " ha.",
        );
      }
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "Zona belum dapat disimpan.",
      );
    } finally {
      setIsSaving(false);
      setConfirmApprovalReset(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveZone();
  }

  if (screenState === "loading") {
    return <ZoneEditorSkeleton />;
  }
  if (screenState === "error") {
    return (
      <div className="space-y-4">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline"
          href={COMMAND_ROUTES.zones}
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Kembali ke daftar zona
        </Link>
        <CommandError message={loadError} onRetry={retryLoad} />
      </div>
    );
  }

  return (
    <div>
      <Link
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline"
        href={COMMAND_ROUTES.zones}
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Kembali ke daftar zona
      </Link>

      <CommandPageHeading
        description={
          isCreate
            ? "Tentukan informasi dasar, lalu gambar batas zona pada peta."
            : "Perbarui data dasar atau pindahkan titik batas zona yang sudah tersimpan."
        }
        title={isCreate ? "Buat zona" : "Ubah zona"}
      />

      <ZoneEditorForm
        formError={formError}
        isCreate={isCreate}
        isSaving={isSaving}
        onCancel={() => router.push(COMMAND_ROUTES.zones)}
        onPeatDepthChange={setPeatDepth}
        onSubmit={onSubmit}
        onVillageNameChange={setVillageName}
        onZoneNameChange={setZoneName}
        parameterOptions={parameters}
        parameterId={parameterId}
        onParameterChange={setParameterId}
        parameterError={parameterError}
        peatDepth={peatDepth}
        savedMessage={savedMessage}
        villageName={villageName}
        zone={zone}
        zoneName={zoneName}
      >
        <ZoneBoundaryControls
          disabled={isSaving}
          drawBoundary={drawBoundary}
          isCreate={isCreate}
          movingVertex={movingVertex}
          onDrawBoundaryChange={setDrawBoundary}
          onUndo={() => {
            setVertices((current) => current.slice(0, -1));
            setSavedMessage("");
          }}
          onReset={() => {
            setVertices([]);
            setInnerRings([]);
            setMovingVertex(null);
            setSavedMessage("");
          }}
          onMovingVertexChange={setMovingVertex}
          vertices={vertices}
        />
        <ZoneMapPanel
          draftEditing={!isSaving && (drawBoundary || movingVertex !== null)}
          mapError={mapError}
          onMapClick={(coordinates) => {
            if (!isSaving) handleMapClick(coordinates);
          }}
          points={mapPoints}
          zones={mapZones}
        />
      </ZoneEditorForm>

      {confirmApprovalReset && zone ? (
        <ZoneApprovalResetDialog
          isSaving={isSaving}
          onCancel={() => setConfirmApprovalReset(false)}
          onConfirm={() => void saveZone(true)}
          zoneName={zone.name}
        />
      ) : null}
    </div>
  );
}
