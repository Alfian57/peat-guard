"use client";

import { useState, type FormEvent } from "react";
import type { CommandWaterPoint } from "@/lib/server/water/data";
import type { CommandZone } from "@/lib/server/zones/data";
import { MapCoordinatePicker } from "@/components/maps/map-coordinate-picker";
import { WaterPointFormField } from "@/components/command/water-points/water-point-form-field";
import { WATER_POINT_TYPE_OPTIONS } from "@/lib/water-point-labels";

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
      className="rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6"
      onSubmit={submit}
    >
      <h2 className="sr-only" id="water-form-heading">
        {initialPoint ? "Ubah titik air" : "Tambah titik air"}
      </h2>

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
            {WATER_POINT_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </WaterPointFormField>
        <div className="sm:col-span-2">
          <MapCoordinatePicker
            heightClassName="h-64 sm:h-72"
            hint="Klik pada peta untuk menempatkan atau memindahkan titik koordinat air."
            latitude={
              latitude.trim() === "" || Number.isNaN(Number(latitude))
                ? null
                : Number(latitude)
            }
            longitude={
              longitude.trim() === "" || Number.isNaN(Number(longitude))
                ? null
                : Number(longitude)
            }
            onChange={({ latitude: nextLat, longitude: nextLng }) => {
              setLatitude(nextLat.toFixed(6));
              setLongitude(nextLng.toFixed(6));
              setValidationError("");
            }}
            pointKind="water"
            title="Tentukan lokasi titik air di peta"
            zones={zones}
          />
        </div>
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
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          className="inline-flex h-9 min-h-9 cursor-pointer items-center justify-center rounded-xl border border-peat-forest/20 px-4 text-xs font-semibold text-peat-forest transition-colors hover:bg-peat-paper focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-peat-green disabled:opacity-60"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Batal
        </button>
        <button
          className="inline-flex h-9 min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-peat-forest px-4 text-xs font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-peat-green disabled:cursor-wait disabled:opacity-60"
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
