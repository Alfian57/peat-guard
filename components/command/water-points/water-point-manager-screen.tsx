"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Droplets, Plus } from "lucide-react";

import { CommandError } from "@/components/command/command-feedback";
import { WaterPointGridSkeleton } from "@/components/command/water-points/water-point-grid-skeleton";
import { CommandPageHeading } from "@/components/command/command-page-heading";
import {
  isWaterPointsResponse,
  requestCommandJson,
} from "@/components/command/command-api";
import {
  COMMAND_API_ROUTES,
  COMMAND_ROUTES,
  waterPointApiRoute,
} from "@/components/command/routes";
import { WaterPointTableRow } from "@/components/command/water-points/water-point-table-row";
import { WaterPointDeleteDialog } from "@/components/command/water-points/water-point-delete-dialog";
import { toast } from "@/components/ui/toast";
import type { CommandWaterPoint } from "@/lib/server/water/data";

type LoadState = "loading" | "ready" | "error";

export function WaterPointManagerScreen() {
  const [state, setState] = useState<LoadState>("loading");
  const [points, setPoints] = useState<CommandWaterPoint[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState("");
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
    requestCommandJson(COMMAND_API_ROUTES.waterPoints, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((pointPayload) => {
        if (!isWaterPointsResponse(pointPayload)) {
          throw new Error("Data titik air dari server tidak sesuai format.");
        }
        setPoints(pointPayload.waterPoints);
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
      toast.success(
        "Titik air dihapus",
        `Titik air ${deleteTarget.name} berhasil dihapus.`,
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

  return (
    <div>
      <CommandPageHeading
        action={
          <Link
            className="inline-flex h-8 min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-peat-forest px-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-peat-green"
            href={COMMAND_ROUTES.createWaterPoint}
          >
            <Plus aria-hidden="true" size={14} />
            Tambah titik air
          </Link>
        }
        description="Catat lokasi sekat kanal, embung, dan sumber air. Titik yang sudah dipakai laporan tidak dapat dihapus."
        title="Titik sumber air"
      />

      {state === "loading" ? (
        <WaterPointGridSkeleton />
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
          <Link
            className="mt-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-peat-green"
            href={COMMAND_ROUTES.createWaterPoint}
          >
            <Plus aria-hidden="true" size={16} />
            Tambah titik pertama
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <caption className="sr-only">Daftar titik sumber air</caption>
              <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-peat-forest/70">
                <tr>
                  <th className="px-4 py-3.5" scope="col">
                    Nama titik air
                  </th>
                  <th className="px-4 py-3.5" scope="col">
                    Jenis titik
                  </th>
                  <th className="px-4 py-3.5" scope="col">
                    Zona terkait
                  </th>
                  <th className="px-4 py-3.5" scope="col">
                    Koordinat
                  </th>
                  <th className="px-4 py-3.5 text-right" scope="col">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-peat-forest/10 text-sm">
                {points.map((point) => (
                  <WaterPointTableRow
                    key={point.id}
                    onDelete={(target) => {
                      setDeleteError("");
                      setDeleteTarget(target);
                    }}
                    point={point}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
