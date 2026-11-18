import type { FormEvent, ReactNode } from "react";
import { Check } from "lucide-react";

import { ZoneEditorFormField } from "@/components/command/zones/zone-editor-form-field";
import type { CommandZone } from "@/lib/server/zones/data";

export function ZoneEditorForm({
  children,
  formError,
  isCreate,
  isSaving,
  onCancel,
  onPeatDepthChange,
  onSubmit,
  onVillageNameChange,
  onZoneNameChange,
  parameterOptions,
  parameterId,
  onParameterChange,
  parameterError,
  peatDepth,
  savedMessage,
  villageName,
  zone,
  zoneName,
}: {
  children: ReactNode;
  formError: string;
  isCreate: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onPeatDepthChange: (depth: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVillageNameChange: (name: string) => void;
  onZoneNameChange: (name: string) => void;
  parameterOptions: Array<{
    id: string;
    name: string;
    isActive: boolean;
    isDemoData: boolean;
  }>;
  parameterId: string;
  onParameterChange: (id: string) => void;
  parameterError: string;
  peatDepth: string;
  savedMessage: string;
  villageName: string;
  zone: CommandZone | null;
  zoneName: string;
}) {
  return (
    <form
      aria-labelledby="zone-form-heading"
      className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs"
      onSubmit={onSubmit}
    >
      <div className="grid xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
        <section className="min-w-0 space-y-5 border-b border-peat-forest/10 p-5 sm:p-6 xl:border-r xl:border-b-0">
          <div>
            <h2
              className="font-heading text-2xl font-bold text-peat-forest"
              id="zone-form-heading"
            >
              Informasi zona
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Lengkapi data wilayah yang akan dipantau.
            </p>
          </div>
          <ZoneEditorFormField label="Nama zona" required>
            <input
              autoComplete="off"
              className="min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest"
              disabled={isSaving}
              maxLength={150}
              onChange={(event) => onZoneNameChange(event.currentTarget.value)}
              placeholder="Kesatuan Gambut Rasau Jaya"
              required
              value={zoneName}
            />
          </ZoneEditorFormField>
          <ZoneEditorFormField label="Desa" optional>
            <input
              autoComplete="off"
              className="min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest"
              disabled={isSaving}
              maxLength={100}
              onChange={(event) =>
                onVillageNameChange(event.currentTarget.value)
              }
              placeholder="Desa Rasau Jaya I"
              value={villageName}
            />
          </ZoneEditorFormField>
          <ZoneEditorFormField
            hint="0 sampai 20 meter"
            label="Kedalaman gambut (meter)"
            required
          >
            <input
              className="min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 font-mono text-sm text-peat-forest"
              disabled={isSaving}
              inputMode="decimal"
              max="20"
              min="0"
              onChange={(event) => onPeatDepthChange(event.currentTarget.value)}
              placeholder="2.50"
              required
              step="0.01"
              type="number"
              value={peatDepth}
            />
          </ZoneEditorFormField>
          <ZoneEditorFormField label="Versi parameter karbon">
            <select
              className="min-h-11 w-full rounded-xl border px-3 text-sm"
              disabled={isSaving || !parameterOptions.length}
              value={parameterId}
              onChange={(event) => onParameterChange(event.currentTarget.value)}
            >
              {isCreate ? <option value="">Gunakan versi aktif</option> : null}
              {parameterOptions.map((parameter) => (
                <option key={parameter.id} value={parameter.id}>
                  {parameter.name}
                  {parameter.isDemoData ? " (ilustratif)" : ""}
                </option>
              ))}
            </select>
            {parameterError ? <p role="status">{parameterError}</p> : null}
          </ZoneEditorFormField>
          {zone?.reviewNote ? (
            <p className="rounded-lg bg-peat-paper p-3 text-sm">
              <strong>Catatan revisi Verifikator</strong>
              <br />
              {zone.reviewNote}
            </p>
          ) : null}
          {zone?.overlapsApprovedZone ? (
            <p className="rounded-lg bg-peat-paper p-3 text-sm">
              Batas zona tumpang tindih dengan zona yang sudah disetujui.
            </p>
          ) : null}
          {zone ? (
            <dl className="grid grid-cols-2 gap-4 border-t border-peat-forest/10 pt-5">
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                  Luas tersimpan
                </dt>
                <dd className="mt-1 text-sm font-semibold wrap-anywhere text-peat-forest">
                  {new Intl.NumberFormat("id-ID", {
                    maximumFractionDigits: 2,
                  }).format(zone.areaHectares)}{" "}
                  ha
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                  Biomassa gambut
                </dt>
                <dd className="mt-1 text-sm font-semibold wrap-anywhere text-peat-forest">
                  {new Intl.NumberFormat("id-ID", {
                    maximumFractionDigits: 2,
                  }).format(zone.carbonFactor)}{" "}
                  <span className="text-xs font-normal">t C/ha</span>
                </dd>
              </div>
            </dl>
          ) : null}
          <p className="text-xs leading-5 text-muted-foreground">
            Luas dihitung otomatis dari batas zona saat disimpan.
          </p>
          {zone?.isApproved ? (
            <p className="border-l-2 border-peat-sun pl-3 text-xs leading-5 text-peat-forest/80">
              Zona ini sudah disetujui Verifikator. Mengubah batas, parameter
              karbon, atau kedalaman gambut akan mencabut persetujuan secara
              otomatis.
            </p>
          ) : null}
        </section>
        <div className="min-w-0 space-y-4 p-5 sm:p-6">{children}</div>
      </div>
      <div className="border-t border-peat-forest/10 px-5 py-4 sm:px-6">
        {formError ? (
          <p
            className="mb-4 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-900"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
        {savedMessage ? (
          <p className="mb-4 text-sm leading-5 text-safe" role="status">
            {savedMessage}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-peat-forest/20 px-4 text-xs font-semibold text-peat-forest transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:opacity-60"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            Batal
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-peat-forest px-4 text-xs font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            <Check aria-hidden="true" size={16} />
            {isSaving
              ? "Menyimpan…"
              : isCreate
                ? "Simpan zona"
                : "Simpan perubahan"}
          </button>
        </div>
      </div>
    </form>
  );
}
