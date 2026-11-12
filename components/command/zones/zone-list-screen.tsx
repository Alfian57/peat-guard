"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { CommandError } from "@/components/command/command-feedback";
import { ZoneListSkeleton } from "@/components/command/zones/zone-list-skeleton";
import { CommandPageHeading } from "@/components/command/command-page-heading";
import {
  isZonesResponse,
  isWaterPointsResponse,
  requestCommandJson,
} from "@/components/command/command-api";
import {
  COMMAND_API_ROUTES,
  COMMAND_ROUTES,
  zoneApiRoute,
} from "@/components/command/routes";
import { ZoneTableRow } from "@/components/command/zones/zone-table-row";
import { ZoneDeleteDialog } from "@/components/command/zones/zone-delete-dialog";
import { ZoneSummaryGrid } from "@/components/command/zones/zone-summary-grid";
import { toast } from "@/components/ui/toast";
import type { CommandZone } from "@/lib/server/zones/data";
import type { CommandWaterPoint } from "@/lib/server/water/data";

type LoadState = "loading" | "ready" | "error";

export function ZoneListScreen() {
  const [state, setState] = useState<LoadState>("loading");
  const [zones, setZones] = useState<CommandZone[]>([]);
  const [waterPoints, setWaterPoints] = useState<CommandWaterPoint[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CommandZone | null>(null);
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
      requestCommandJson(COMMAND_API_ROUTES.zones, {
        cache: "no-store",
        signal: controller.signal,
      }),
      requestCommandJson(COMMAND_API_ROUTES.waterPoints, {
        cache: "no-store",
        signal: controller.signal,
      }),
    ])
      .then(([zonePayload, pointPayload]) => {
        if (
          !isZonesResponse(zonePayload) ||
          !isWaterPointsResponse(pointPayload)
        ) {
          throw new Error(
            "Data zona atau titik air dari server tidak sesuai format.",
          );
        }
        setZones(zonePayload.zones);
        setWaterPoints(pointPayload.waterPoints);
        setState("ready");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error ? cause.message : "Data zona belum tersedia.",
        );
        setState("error");
      });
    return () => controller.abort();
  }, [retryKey]);

  const waterCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const point of waterPoints) {
      if (point.zoneId) {
        counts.set(point.zoneId, (counts.get(point.zoneId) ?? 0) + 1);
      }
    }
    return counts;
  }, [waterPoints]);

  async function deleteZone() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await requestCommandJson(zoneApiRoute(deleteTarget.id), {
        method: "DELETE",
      });
      setZones((current) =>
        current.filter((zone) => zone.id !== deleteTarget.id),
      );
      toast.success(
        "Zona dihapus",
        `Zona ${deleteTarget.name} berhasil dihapus.`,
      );
      setDeleteTarget(null);
    } catch (cause) {
      setDeleteError(
        cause instanceof Error ? cause.message : "Zona belum dapat dihapus.",
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
            href={COMMAND_ROUTES.createZone}
          >
            <Plus aria-hidden="true" size={14} />
            Tambah zona
          </Link>
        }
        description="Kelola batas dan parameter zona gambut. Persetujuan zona hanya dapat dilakukan oleh Verifikator."
        title="Zona gambut"
      />

      <ZoneSummaryGrid
        areaHectares={zones.reduce(
          (total, zone) => total + zone.areaHectares,
          0,
        )}
        totalZones={zones.length}
        waterPoints={waterPoints.length}
      />

      {state === "loading" ? (
        <ZoneListSkeleton />
      ) : state === "error" ? (
        <CommandError message={error} onRetry={refreshData} />
      ) : zones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-peat-forest/20 bg-white p-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-peat-forest">
            Belum ada zona terdaftar
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-peat-forest/70">
            Buat zona dengan menggambar batasnya pada peta. Luas dihitung server
            dari geometri yang disimpan.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white hover:bg-peat-green"
            href={COMMAND_ROUTES.createZone}
          >
            Buat zona pertama
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <caption className="sr-only">Daftar zona gambut</caption>
              <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-peat-forest/70">
                <tr>
                  <th className="px-4 py-3.5" scope="col">
                    Nama Zona & Desa
                  </th>
                  <th className="px-4 py-3.5" scope="col">
                    Status Verifikasi
                  </th>
                  <th className="px-4 py-3.5" scope="col">
                    Luas Terhitung
                  </th>
                  <th className="px-4 py-3.5" scope="col">
                    Kedalaman
                  </th>
                  <th className="px-4 py-3.5" scope="col">
                    Faktor Karbon
                  </th>
                  <th className="px-4 py-3.5" scope="col">
                    Sumber Air
                  </th>
                  <th className="px-4 py-3.5 text-right" scope="col">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-peat-forest/10 text-sm">
                {zones.map((zone) => (
                  <ZoneTableRow
                    key={zone.id}
                    onDelete={(selectedZone) => {
                      setDeleteError("");
                      setDeleteTarget(selectedZone);
                    }}
                    waterPointCount={waterCounts.get(zone.id) ?? 0}
                    zone={zone}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteTarget ? (
        <ZoneDeleteDialog
          deleting={deleting}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void deleteZone()}
          zone={deleteTarget}
        />
      ) : null}
    </div>
  );
}
