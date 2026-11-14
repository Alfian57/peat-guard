import { MapPin, WifiOff } from "lucide-react";
import { MapCoordinatePicker } from "@/components/maps/map-coordinate-picker";
import { FieldFeedback } from "./field-feedback";
import {
  fieldCaptureMapHeight,
  fieldCapturePanel,
} from "./field-report-layout";

export function FieldReportLocationField({
  invalid,
  isConnected,
  latitude,
  longitude,
  locationMessage,
  accuracyMeters,
  isDemoSample,
  captureLocation,
  onCoordinatesChange,
}: {
  invalid: boolean;
  isConnected: boolean;
  latitude: string;
  longitude: string;
  locationMessage: string;
  accuracyMeters: number | null;
  isDemoSample: boolean;
  captureLocation: () => void;
  onCoordinatesChange: (latitude: string, longitude: string) => void;
}) {
  return (
    <section
      role="group"
      aria-labelledby="location-title"
      aria-describedby={invalid ? "form-error" : undefined}
      className={`flex flex-col ${fieldCapturePanel}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="location-title"
          className="font-heading text-2xl font-bold text-peat-forest"
        >
          Lokasi
        </h2>
        <button
          type="button"
          onClick={captureLocation}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-peat-paper px-2.5 text-xs font-semibold text-peat-forest hover:bg-peat-green/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
        >
          <MapPin aria-hidden="true" size={14} /> Ambil GPS
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {isConnected
          ? "Gunakan GPS, peta, atau masukkan koordinat temuan."
          : "Gunakan GPS atau masukkan koordinat temuan."}
      </p>
      {isDemoSample ? (
        <p className="mt-2 text-xs font-semibold text-amber-900">
          Laporan ini memakai foto sampel demo, bukan bukti kejadian nyata.
        </p>
      ) : null}
      <div className="mt-3">
        {isConnected ? (
          <MapCoordinatePicker
            compact
            heightClassName={fieldCaptureMapHeight}
            hint="Ketuk lokasi pada peta untuk memilih atau memindahkan titik."
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
              onCoordinatesChange(nextLat.toFixed(6), nextLng.toFixed(6));
            }}
            pointKind="report"
            showCurrentLocationButton={false}
            title="Tentukan titik laporan di peta"
          />
        ) : (
          <FieldFeedback icon={WifiOff} title="Peta tersedia saat terhubung">
            GPS dan pengisian koordinat tetap tersedia.
          </FieldFeedback>
        )}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
        <label className="min-w-0 text-xs font-semibold text-peat-forest">
          Lintang{" "}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            required
            aria-invalid={invalid}
            inputMode="decimal"
            value={latitude}
            onChange={(event) => {
              onCoordinatesChange(event.target.value, longitude);
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-peat-green sm:text-sm"
            placeholder="-2.319400"
          />
        </label>
        <label className="min-w-0 text-xs font-semibold text-peat-forest">
          Bujur{" "}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            required
            aria-invalid={invalid}
            inputMode="decimal"
            value={longitude}
            onChange={(event) => {
              onCoordinatesChange(latitude, event.target.value);
            }}
            className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-peat-green sm:text-sm"
            placeholder="113.910200"
          />
        </label>
      </div>
      {locationMessage ? (
        <p className="mt-2 text-xs text-peat-forest" role="status">
          {locationMessage}
        </p>
      ) : accuracyMeters !== null ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Akurasi GPS sekitar {accuracyMeters} meter.
        </p>
      ) : null}
    </section>
  );
}
