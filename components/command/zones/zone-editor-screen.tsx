"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  CommandError,
  CommandLoading,
} from "@/components/command/command-feedback";
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
import { ZoneMapPanel } from "@/components/command/zones/zone-map-panel";
import {
  polygonFromVertices,
  polygonWithUpdatedOuterRing,
} from "@/components/command/zones/zone-geometry";
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
  const [zone, setZone] = useState<CommandZone | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [villageName, setVillageName] = useState("");
  const [peatDepth, setPeatDepth] = useState("1.5");
  const [geometry, setGeometry] = useState<ZonePolygon | null>(null);
  const [drawBoundary, setDrawBoundary] = useState(false);
  const [movingVertex, setMovingVertex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [confirmApprovalReset, setConfirmApprovalReset] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
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
          setZoneName(currentZone.name);
          setVillageName(currentZone.villageName ?? "");
          setPeatDepth(String(currentZone.peatDepthMeters));
          setGeometry(currentZone.geometry);
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

  const vertices = geometry?.coordinates[0]?.slice(0, -1) ?? [];
  const mapZones = useMemo<MapZone[]>(() => {
    const existingZones = (mapData?.zones ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      areaHectares: item.areaHectares,
      geometry: item.geometry,
      isDemoData: item.isDemoData,
    }));

    if (!geometry || vertices.length < 3) return existingZones;

    const preview: MapZone = {
      id: "draft-" + (zoneId ?? "new"),
      name: zoneName || "Batas zona baru",
      areaHectares: zone?.areaHectares ?? 0,
      geometry: geometry as MapZone["geometry"],
    };
    return zoneId
      ? existingZones.map((item) => (item.id === zoneId ? preview : item))
      : [...existingZones, preview];
  }, [
    geometry,
    mapData?.zones,
    vertices.length,
    zone?.areaHectares,
    zoneId,
    zoneName,
  ]);
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
      JSON.stringify(geometry) !== JSON.stringify(zone.geometry)),
  );

  function handleMapClick(coordinates: [number, number]) {
    const rounded: [number, number] = [
      Number(coordinates[0].toFixed(6)),
      Number(coordinates[1].toFixed(6)),
    ];

    if (movingVertex !== null && geometry) {
      const nextVertices = geometry.coordinates[0].slice(0, -1);
      nextVertices[movingVertex] = rounded;
      setGeometry(polygonWithUpdatedOuterRing(geometry, nextVertices));
      setMovingVertex(null);
      setSavedMessage("");
      return;
    }

    if (drawBoundary) {
      const nextVertices = [...vertices, rounded];
      setGeometry(
        geometry
          ? polygonWithUpdatedOuterRing(geometry, nextVertices)
          : polygonFromVertices(nextVertices),
      );
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
    if (!isCreate && Object.keys(payload).length === 0) {
      setSavedMessage("Tidak ada perubahan untuk disimpan.");
      return;
    }

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
      setZoneName(savedZone.name);
      setVillageName(savedZone.villageName ?? "");
      setPeatDepth(String(savedZone.peatDepthMeters));
      setGeometry(savedZone.geometry);
      const area = new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 2,
      }).format(savedZone.areaHectares);
      setSavedMessage(
        (isCreate ? "Zona dibuat" : "Perubahan tersimpan") +
          ". Luas hasil perhitungan server: " +
          area +
          " ha.",
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
    return <CommandLoading label="Memuat detail zona…" />;
  }
  if (screenState === "error") {
    return <CommandError message={loadError} onRetry={retryLoad} />;
  }

  return (
    <div>
      <CommandPageHeading
        action={
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-peat-forest/15 px-4 text-sm font-semibold text-peat-forest hover:bg-white"
            href={COMMAND_ROUTES.zones}
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Daftar zona
          </Link>
        }
        description={
          isCreate
            ? "Tentukan informasi dasar, lalu gambar batas zona pada peta."
            : "Perbarui data dasar atau pindahkan titik batas zona yang sudah tersimpan."
        }
        eyebrow="POSKO · ZONA GAMBUT"
        title={isCreate ? "Buat zona" : "Ubah zona"}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,390px)_minmax(0,1fr)]">
        <ZoneEditorForm
          drawBoundary={drawBoundary}
          formError={formError}
          geometry={geometry}
          isCreate={isCreate}
          isSaving={isSaving}
          mapError={mapError}
          movingVertex={movingVertex}
          onDrawBoundaryChange={setDrawBoundary}
          onGeometryChange={(nextGeometry) => {
            setGeometry(nextGeometry);
            setSavedMessage("");
          }}
          onMovingVertexChange={setMovingVertex}
          onPeatDepthChange={setPeatDepth}
          onSubmit={onSubmit}
          onVillageNameChange={setVillageName}
          onZoneNameChange={setZoneName}
          peatDepth={peatDepth}
          savedMessage={savedMessage}
          villageName={villageName}
          vertices={vertices}
          zone={zone}
          zoneName={zoneName}
        />
        <ZoneMapPanel
          draftEditing={drawBoundary || movingVertex !== null}
          mapError={mapError}
          onMapClick={handleMapClick}
          points={mapPoints}
          zones={mapZones}
        />
      </div>

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
