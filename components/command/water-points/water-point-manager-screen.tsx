"use client";

import { useEffect, useState } from "react";
import { Droplets, Plus } from "lucide-react";

import {
  CommandError,
  CommandLoading,
} from "@/components/command/command-feedback";
import { CommandPageHeading } from "@/components/command/command-page-heading";
import {
  isWaterPointResponse,
  isWaterPointsResponse,
  isZonesResponse,
  requestCommandJson,
} from "@/components/command/command-api";
import {
  COMMAND_API_ROUTES,
  waterPointApiRoute,
} from "@/components/command/routes";
import {
  WaterPointForm,
  type WaterPointInput,
} from "@/components/command/water-points/water-point-form";
import { WaterPointCard } from "@/components/command/water-points/water-point-card";
import { WaterPointDeleteDialog } from "@/components/command/water-points/water-point-delete-dialog";
import type { CommandWaterPoint } from "@/lib/server/water/data";
import type { CommandZone } from "@/lib/server/zones/data";

type LoadState = "loading" | "ready" | "error";

export function WaterPointManagerScreen() {
  const [state, setState] = useState<LoadState>("loading");
  const [points, setPoints] = useState<CommandWaterPoint[]>([]);
  const [zones, setZones] = useState<CommandZone[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<CommandWaterPoint | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommandWaterPoint | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function refreshData() {
    setState("loading");
    setError("");
    setRetryKey((current) => current + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      requestCommandJson(COMMAND_API_ROUTES.waterPoints, {
        cache: "no-store",
        signal: controller.signal,
      }),
      requestCommandJson(COMMAND_API_ROUTES.zones, {
        cache: "no-store",
        signal: controller.signal,
      }),
    ])
      .then(([pointPayload, zonePayload]) => {
        if (
          !isWaterPointsResponse(pointPayload) ||
          !isZonesResponse(zonePayload)
        ) {
          throw new Error(
            "Data titik air atau zona dari server tidak sesuai format.",
          );
        }
        setPoints(pointPayload.waterPoints);
        setZones(zonePayload.zones);
        setState("ready");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Data titik air belum tersedia.",
        );
        setState("error");
      });
    return () => controller.abort();
  }, [retryKey]);

  async function savePoint(input: WaterPointInput) {
    setSaving(true);
    setFormError("");
    try {
      const result = await requestCommandJson(
        editingPoint
          ? waterPointApiRoute(editingPoint.id)
          : COMMAND_API_ROUTES.waterPoints,
        {
          method: editingPoint ? "PATCH" : "POST",
          body: JSON.stringify(input),
        },
      );
      if (!isWaterPointResponse(result)) {
        throw new Error("Respons titik air dari server tidak sesuai format.");
      }

      const savedPoint = result.waterPoint;
      setPoints((current) =>
        editingPoint
          ? current.map((point) =>
              point.id === savedPoint.id ? savedPoint : point,
            )
          : [...current, savedPoint].sort((left, right) =>
              left.name.localeCompare(right.name, "id"),
            ),
      );
      closeForm();
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Titik air belum dapat disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deletePoint() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await requestCommandJson(waterPointApiRoute(deleteTarget.id), {
        method: "DELETE",
      });
      setPoints((current) =>
        current.filter((point) => point.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (cause) {
      setDeleteError(
        cause instanceof Error
          ? cause.message
          : "Titik air belum dapat dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function openCreateForm() {
    setEditingPoint(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEditForm(point: CommandWaterPoint) {
    setEditingPoint(point);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingPoint(null);
    setFormError("");
  }

  return (
    <div>
      <CommandPageHeading
        action={
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white hover:bg-peat-green"
            onClick={openCreateForm}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            Tambah titik air
          </button>
        }
        description="Catat lokasi sekat kanal, embung, dan sumber air. Titik yang sudah dipakai laporan tidak dapat dihapus."
        eyebrow="POSKO · SARANA PEMADAMAN"
        title="Titik sumber air"
      />

      {formOpen ? (
        <div className="mb-5">
          <WaterPointForm
            key={editingPoint?.id ?? "new"}
            error={formError}
            initialPoint={editingPoint}
            isSaving={saving}
            onCancel={closeForm}
            onSave={(input) => void savePoint(input)}
            zones={zones}
          />
        </div>
      ) : null}

      {state === "loading" ? (
        <CommandLoading label="Memuat titik sumber air…" />
      ) : state === "error" ? (
        <CommandError message={error} onRetry={refreshData} />
      ) : points.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-peat-forest/20 bg-white p-8 text-center">
          <Droplets
            aria-hidden="true"
            className="mx-auto text-sky-700"
            size={31}
          />
          <h2 className="mt-3 font-heading text-2xl font-bold text-peat-forest">
            Belum ada titik air
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-peat-forest/70">
            Tambahkan lokasi sumber air, embung, atau sekat kanal untuk membantu
            koordinasi regu.
          </p>
          <button
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white hover:bg-peat-green"
            onClick={openCreateForm}
            type="button"
          >
            <Plus aria-hidden="true" size={16} />
            Tambah titik pertama
          </button>
        </div>
      ) : (
        <ul
          aria-label="Daftar titik sumber air"
          className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3"
        >
          {points.map((point) => (
            <WaterPointCard
              key={point.id}
              onDelete={(target) => {
                setDeleteError("");
                setDeleteTarget(target);
              }}
              onEdit={openEditForm}
              point={point}
            />
          ))}
        </ul>
      )}

      {deleteTarget ? (
        <WaterPointDeleteDialog
          deleting={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void deletePoint()}
          point={deleteTarget}
        />
      ) : null}
    </div>
  );
}
