"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  isZoneResponse,
  requestCommandJson,
} from "@/components/command/command-api";
import { MapCanvasLoader } from "@/components/maps/map-canvas-loader";
import { toast } from "@/components/ui/toast";
import { API_ROUTES } from "@/lib/routes";
import type { CommandZone } from "@/lib/server/zones/data";
import { zoneVerificationStatusLabel } from "@/lib/zone-labels";

const numberFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

export function ZoneReviewRow({
  zone,
  revision,
}: {
  zone: CommandZone;
  revision: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");

  async function approve() {
    if (saving || approved) return;
    setSaving(true);
    setError("");
    try {
      const result = await requestCommandJson(
        API_ROUTES.command.zoneApprove(zone.id),
        {
          method: "POST",
          body: JSON.stringify({ expectedRevision: revision }),
        },
      );
      if (!isZoneResponse(result) || !result.zone.isApproved) {
        throw new Error(
          "Persetujuan belum terkonfirmasi. Muat ulang daftar zona.",
        );
      }
      setApproved(true);
      setOpen(false);
      toast.success("Zona disetujui", zone.name);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Zona belum dapat disetujui.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="align-middle transition-colors hover:bg-peat-paper/40">
      <th className="min-w-48 px-4 py-4 text-left" scope="row">
        <span className="font-semibold text-peat-forest">{zone.name}</span>
        {zone.isDemoData ? (
          <span className="mt-1 inline-flex rounded-full bg-peat-sun/20 px-2 py-0.5 text-[0.65rem] font-semibold text-peat-forest">
            Data ilustratif
          </span>
        ) : null}
      </th>
      <td className="min-w-40 px-4 py-4 text-sm text-muted-foreground">
        {zone.villageName || "Desa belum ditentukan"}
      </td>
      <td className="px-4 py-4 font-mono text-sm whitespace-nowrap text-peat-forest">
        {numberFormat.format(zone.areaHectares)} ha
      </td>
      <td className="px-4 py-4 font-mono text-sm whitespace-nowrap text-peat-forest">
        {numberFormat.format(zone.peatDepthMeters)} m
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold ${approved ? "bg-safe/10 text-safe" : "bg-warning/10 text-warning"}`}
        >
          {zoneVerificationStatusLabel(approved)}
        </span>
      </td>
      <td className="px-4 py-4 text-right whitespace-nowrap">
        <Dialog.Root
          open={open}
          onOpenChange={(next) => {
            if (!saving) setOpen(next);
            if (next) setError("");
          }}
        >
          <Dialog.Trigger
            className="min-h-9 rounded-full border border-peat-forest/20 px-3.5 text-xs font-semibold text-peat-forest transition-colors hover:border-peat-green/40 hover:bg-peat-paper hover:text-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
            disabled={approved}
          >
            {approved ? "Disetujui" : "Tinjau zona"}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
            <Dialog.Popup className="fixed inset-x-4 top-1/2 z-[51] mx-auto max-h-[calc(100dvh-2rem)] max-w-2xl -translate-y-1/2 space-y-4 overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-xl sm:p-6">
              <Dialog.Title className="font-heading text-2xl font-bold text-peat-forest">
                {zone.name}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {zone.villageName || "Desa belum ditentukan"} ·{" "}
                {numberFormat.format(zone.areaHectares)} ha · Kedalaman{" "}
                {numberFormat.format(zone.peatDepthMeters)} m
              </Dialog.Description>
              {open ? (
                <MapCanvasLoader
                  className="h-60 overflow-hidden rounded-xl"
                  points={[]}
                  zones={[
                    {
                      id: zone.id,
                      name: zone.name,
                      areaHectares: zone.areaHectares,
                      geometry: zone.geometry,
                    },
                  ]}
                />
              ) : null}
              <section
                aria-labelledby={`zone-boundary-coordinates-${zone.id}`}
                className="rounded-xl border border-border p-3 text-sm"
              >
                <h3
                  className="font-semibold text-peat-forest"
                  id={`zone-boundary-coordinates-${zone.id}`}
                >
                  Koordinat batas zona
                </h3>
                <ol className="mt-2 max-h-36 list-inside list-decimal overflow-y-auto font-mono text-xs">
                  {zone.geometry.coordinates[0]
                    .slice(0, -1)
                    .map(([longitude, latitude], index) => (
                      <li key={index}>
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </li>
                    ))}
                </ol>
              </section>
              {error ? (
                <p role="alert" className="text-sm text-red-800">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Dialog.Close
                  className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-peat-forest"
                  disabled={saving}
                >
                  Batal
                </Dialog.Close>
                <button
                  className="min-h-11 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={saving}
                  onClick={() => void approve()}
                  type="button"
                >
                  {saving ? "Menyimpan…" : "Setujui zona"}
                </button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </td>
    </tr>
  );
}
