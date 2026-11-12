"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { CommandError } from "@/components/command/command-feedback";
import { CommandPageHeading } from "@/components/command/command-page-heading";
import {
  isWaterPointResponse,
  isZonesResponse,
  requestCommandJson,
} from "@/components/command/command-api";
import {
  COMMAND_API_ROUTES,
  COMMAND_ROUTES,
  waterPointApiRoute,
} from "@/components/command/routes";
import { WaterPointEditorSkeleton } from "@/components/command/water-points/water-point-editor-skeleton";
import {
  WaterPointForm,
  type WaterPointInput,
} from "@/components/command/water-points/water-point-form";
import { toast } from "@/components/ui/toast";
import type { CommandWaterPoint } from "@/lib/server/water/data";
import type { CommandZone } from "@/lib/server/zones/data";

type ScreenState = "loading" | "ready" | "error";

export function WaterPointEditorScreen({ pointId }: { pointId?: string }) {
  const router = useRouter();
  const isCreate = pointId === undefined;
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [retryKey, setRetryKey] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [point, setPoint] = useState<CommandWaterPoint | null>(null);
  const [zones, setZones] = useState<CommandZone[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const zonesRequest = requestCommandJson(COMMAND_API_ROUTES.zones, {
      cache: "no-store",
      signal: controller.signal,
    });
    const pointRequest = pointId
      ? requestCommandJson(waterPointApiRoute(pointId), {
          cache: "no-store",
          signal: controller.signal,
        })
      : Promise.resolve(null);

    Promise.allSettled([zonesRequest, pointRequest]).then(
      ([zonesResult, pointResult]) => {
        if (controller.signal.aborted) return;

        if (
          zonesResult.status === "fulfilled" &&
          isZonesResponse(zonesResult.value)
        ) {
          setZones(zonesResult.value.zones);
        } else {
          setLoadError(
            zonesResult.status === "rejected" &&
              zonesResult.reason instanceof Error
              ? zonesResult.reason.message
              : "Data zona dari server tidak sesuai format.",
          );
          setScreenState("error");
          return;
        }

        if (pointId) {
          if (
            pointResult.status === "fulfilled" &&
            isWaterPointResponse(pointResult.value)
          ) {
            setPoint(pointResult.value.waterPoint);
            setScreenState("ready");
          } else {
            setLoadError(
              pointResult.status === "rejected" &&
                pointResult.reason instanceof Error
                ? pointResult.reason.message
                : "Titik air tidak ditemukan atau data tidak sesuai.",
            );
            setScreenState("error");
            return;
          }
        } else {
          setPoint(null);
          setScreenState("ready");
        }
      },
    );

    return () => controller.abort();
  }, [pointId, retryKey]);

  async function handleSave(input: WaterPointInput) {
    setIsSaving(true);
    setFormError("");

    try {
      const endpoint = isCreate
        ? COMMAND_API_ROUTES.waterPoints
        : waterPointApiRoute(pointId);

      await requestCommandJson(endpoint, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      toast.success(
        isCreate ? "Titik air dibuat" : "Titik air diperbarui",
        isCreate
          ? `Titik air ${input.name} berhasil ditambahkan.`
          : `Perubahan titik air ${input.name} berhasil disimpan.`,
      );

      router.push(COMMAND_ROUTES.waterPoints);
    } catch (cause: unknown) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Gagal menyimpan titik air. Periksa koneksi dan coba lagi.",
      );
      setIsSaving(false);
    }
  }

  function handleCancel() {
    router.push(COMMAND_ROUTES.waterPoints);
  }

  return (
    <div>
      <Link
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-peat-forest hover:underline"
        href={COMMAND_ROUTES.waterPoints}
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Kembali ke daftar titik air
      </Link>

      <CommandPageHeading
        description={
          isCreate
            ? "Catat lokasi sekat kanal, embung, atau sumber air baru beserta koordinat peta."
            : "Perbarui informasi titik sumber air, zona terkait, atau geser posisi pin di peta."
        }
        title={isCreate ? "Tambah titik sumber air" : "Ubah titik sumber air"}
      />

      {screenState === "loading" ? (
        <div className="mt-5">
          <WaterPointEditorSkeleton />
        </div>
      ) : screenState === "error" ? (
        <div className="mt-5 space-y-4">
          <CommandError
            message={loadError}
            onRetry={() => {
              setScreenState("loading");
              setLoadError("");
              setRetryKey((k) => k + 1);
            }}
          />
        </div>
      ) : (
        <div className="mt-5">
          <WaterPointForm
            error={formError}
            initialPoint={point}
            isSaving={isSaving}
            onCancel={handleCancel}
            onSave={(input) => void handleSave(input)}
            zones={zones}
          />
        </div>
      )}
    </div>
  );
}
