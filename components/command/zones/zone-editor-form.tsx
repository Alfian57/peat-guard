import type { FormEvent } from "react";
import { Check } from "lucide-react";

import { ZoneBoundaryControls } from "@/components/command/zones/zone-boundary-controls";
import { ZoneEditorFormField } from "@/components/command/zones/zone-editor-form-field";
import type { CommandZone } from "@/lib/server/zones/data";
import type { ZonePolygon } from "@/lib/server/zones/validation";

export function ZoneEditorForm({
  drawBoundary,
  formError,
  geometry,
  isCreate,
  isSaving,
  mapError,
  movingVertex,
  onDrawBoundaryChange,
  onGeometryChange,
  onMovingVertexChange,
  onPeatDepthChange,
  onSubmit,
  onVillageNameChange,
  onZoneNameChange,
  peatDepth,
  savedMessage,
  villageName,
  vertices,
  zone,
  zoneName,
}: {
  drawBoundary: boolean;
  formError: string;
  geometry: ZonePolygon | null;
  isCreate: boolean;
  isSaving: boolean;
  mapError: string;
  movingVertex: number | null;
  onDrawBoundaryChange: (draw: boolean) => void;
  onGeometryChange: (geometry: ZonePolygon | null) => void;
  onMovingVertexChange: (vertex: number | null) => void;
  onPeatDepthChange: (depth: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVillageNameChange: (name: string) => void;
  onZoneNameChange: (name: string) => void;
  peatDepth: string;
  savedMessage: string;
  villageName: string;
  vertices: [number, number][];
  zone: CommandZone | null;
  zoneName: string;
}) {
  return (
    <form
      className="space-y-4 rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <ZoneEditorFormField label="Nama zona" required>
        <input
          autoComplete="off"
          className="mt-1.5 min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest"
          maxLength={150}
          onChange={(event) => onZoneNameChange(event.currentTarget.value)}
          required
          value={zoneName}
        />
      </ZoneEditorFormField>
      <ZoneEditorFormField label="Desa" optional>
        <input
          autoComplete="off"
          className="mt-1.5 min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest"
          maxLength={100}
          onChange={(event) => onVillageNameChange(event.currentTarget.value)}
          value={villageName}
        />
      </ZoneEditorFormField>
      <ZoneEditorFormField
        hint="0 sampai 20 meter"
        label="Kedalaman gambut (meter)"
        required
      >
        <input
          className="mt-1.5 min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 font-mono text-sm text-peat-forest"
          inputMode="decimal"
          max="20"
          min="0"
          onChange={(event) => onPeatDepthChange(event.currentTarget.value)}
          required
          step="0.01"
          type="number"
          value={peatDepth}
        />
      </ZoneEditorFormField>

      {zone ? (
        <div className="rounded-xl bg-peat-paper p-4">
          <p className="text-xs font-medium text-peat-forest/65">
            Luas dihitung server
          </p>
          <p className="mt-1 font-heading text-3xl font-bold text-peat-forest">
            {new Intl.NumberFormat("id-ID", {
              maximumFractionDigits: 2,
            }).format(zone.areaHectares)}{" "}
            ha
          </p>
          <p className="mt-1 text-xs text-peat-forest/65">
            Faktor karbon{" "}
            {new Intl.NumberFormat("id-ID", {
              maximumFractionDigits: 2,
            }).format(zone.carbonFactor)}{" "}
            tCO₂e/ha
          </p>
        </div>
      ) : null}

      {zone?.isApproved ? (
        <div className="rounded-xl border border-peat-sun/60 bg-peat-sun/15 p-4 text-sm leading-6 text-peat-forest">
          Zona ini sudah disetujui Verifikator. Mengubah batas atau kedalaman
          gambut akan mencabut persetujuan secara otomatis.
        </div>
      ) : null}

      <ZoneBoundaryControls
        drawBoundary={drawBoundary}
        geometry={geometry}
        isCreate={isCreate}
        movingVertex={movingVertex}
        onDrawBoundaryChange={onDrawBoundaryChange}
        onGeometryChange={onGeometryChange}
        onMovingVertexChange={onMovingVertexChange}
        vertices={vertices}
      />

      {mapError ? (
        <p className="text-sm leading-5 text-red-800" role="alert">
          Peta atau konteks zona belum tersedia: {mapError}
        </p>
      ) : null}
      {formError ? (
        <p
          className="rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-900"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      {savedMessage ? (
        <p
          className="rounded-xl bg-safe/10 p-3 text-sm leading-5 text-safe"
          role="status"
        >
          {savedMessage}
        </p>
      ) : null}

      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white hover:bg-peat-green disabled:cursor-wait disabled:opacity-60"
        disabled={isSaving}
        type="submit"
      >
        <Check aria-hidden="true" size={17} />
        {isSaving
          ? "Menyimpan…"
          : isCreate
            ? "Simpan zona"
            : "Simpan perubahan"}
      </button>
      <p className="text-xs leading-5 text-peat-forest/60">
        Luas, slug, dan parameter karbon dikelola server. Persetujuan hanya
        tersedia untuk peran Verifikator.
      </p>
    </form>
  );
}
