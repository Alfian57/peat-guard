"use client";

import { useState, type FormEvent } from "react";
import type { CommandWaterPoint } from "@/lib/server/water/data";
import type { CommandZone } from "@/lib/server/zones/data";
import { WaterPointFormField } from "@/components/command/water-points/water-point-form-field";

export type WaterPointInput = {
  name: string;
  type: "SEKAT_KANAL" | "EMBUNG" | "SUMBER_AIR";
  latitude: number;
  longitude: number;
  zoneId: string | null;
};

export function WaterPointForm({
  error,
  initialPoint,
  isSaving,
  onCancel,
  onSave,
  zones,
}: {
  error: string;
  initialPoint: CommandWaterPoint | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (input: WaterPointInput) => void;
  zones: CommandZone[];
}) {
  const [name, setName] = useState(initialPoint?.name ?? "");
  const [type, setType] = useState<WaterPointInput["type"]>(
    initialPoint?.type ?? "SUMBER_AIR",
  );
  const [latitude, setLatitude] = useState(
    initialPoint ? String(initialPoint.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    initialPoint ? String(initialPoint.longitude) : "",
  );
  const [zoneId, setZoneId] = useState(initialPoint?.zoneId ?? "");
  const [validationError, setValidationError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!name.trim() || name.trim().length > 150) {
      setValidationError("Nama titik wajib diisi dan maksimal 150 karakter.");
      return;
    }

    if (
      latitude.trim() === "" ||
      longitude.trim() === "" ||
      !Number.isFinite(parsedLatitude) ||
      parsedLatitude < -90 ||
      parsedLatitude > 90 ||
      !Number.isFinite(parsedLongitude) ||
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      setValidationError("Masukkan lintang -90–90 dan bujur -180–180.");
      return;
    }

    onSave({
      name: name.trim(),
      type,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      zoneId: zoneId || null,
    });
  }

  return (
    <form
      aria-labelledby="water-form-heading"
      className="rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-sm"
      onSubmit={submit}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2
            className="font-heading text-2xl font-bold text-peat-forest"
            id="water-form-heading"
          >
            {initialPoint ? "Ubah titik air" : "Tambah titik air"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-peat-forest/65">
            Koordinat tersimpan sebagai titik geospasial.
          </p>
        </div>
        <button
          aria-label="Tutup formulir"
          className="grid min-h-11 min-w-11 place-items-center rounded-lg text-sm text-peat-forest hover:bg-peat-paper"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Tutup
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <WaterPointFormField label="Nama titik" required>
          <input
            autoComplete="off"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest"
            maxLength={150}
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="Sekat Kanal Primer A"
            required
            value={name}
          />
        </WaterPointFormField>
        <WaterPointFormField label="Jenis titik" required>
          <select
            className="mt-1.5 min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest"
            onChange={(event) =>
              setType(event.currentTarget.value as WaterPointInput["type"])
            }
            value={type}
          >
            <option value="SUMBER_AIR">Sumber air</option>
            <option value="EMBUNG">Embung</option>
            <option value="SEKAT_KANAL">Sekat kanal</option>
          </select>
        </WaterPointFormField>
        <WaterPointFormField hint="-90 sampai 90" label="Lintang" required>
          <input
            className="mt-1.5 min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 font-mono text-sm text-peat-forest"
            inputMode="decimal"
            max="90"
            min="-90"
            onChange={(event) => setLatitude(event.currentTarget.value)}
            placeholder="-2.319400"
            required
            step="any"
            type="number"
            value={latitude}
          />
        </WaterPointFormField>
        <WaterPointFormField hint="-180 sampai 180" label="Bujur" required>
          <input
            className="mt-1.5 min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 font-mono text-sm text-peat-forest"
            inputMode="decimal"
            max="180"
            min="-180"
            onChange={(event) => setLongitude(event.currentTarget.value)}
            placeholder="113.910200"
            required
            step="any"
            type="number"
            value={longitude}
          />
        </WaterPointFormField>
        <div className="sm:col-span-2">
          <WaterPointFormField label="Zona terkait" optional>
            <select
              className="mt-1.5 min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest"
              onChange={(event) => setZoneId(event.currentTarget.value)}
              value={zoneId}
            >
              <option value="">Tidak dikaitkan ke zona</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </WaterPointFormField>
        </div>
      </div>

      {validationError ? (
        <p
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-900"
          role="alert"
        >
          {validationError}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          className="min-h-11 rounded-xl border border-peat-forest/20 px-4 text-sm font-semibold text-peat-forest"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Batal
        </button>
        <button
          className="min-h-11 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white hover:bg-peat-green disabled:cursor-wait disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving
            ? "Menyimpan…"
            : initialPoint
              ? "Simpan perubahan"
              : "Simpan titik air"}
        </button>
      </div>
    </form>
  );
}
