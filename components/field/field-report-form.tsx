"use client";

import {
  CANAL_CONDITIONS,
  CANAL_CONDITION_LABELS,
  isCanalCondition,
  type CanalCondition,
} from "@/lib/canal-observation";
import { Sparkles } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { compressPhoto } from "@/lib/client/offline/compress-photo";
import { FieldReportPhotoField } from "./field-report-photo-field";
import { FieldReportLocationField } from "./field-report-location-field";
import { FieldReportNotesField } from "./field-report-notes-field";
import {
  fieldCaptureGrid,
  fieldFormActionsGrid,
  fieldFormSaveArea,
} from "./field-report-layout";
import type {
  NewFieldReport,
  QueuedFieldReport,
} from "@/lib/client/offline/types";

type FieldReportFormProps = {
  initialReport?: QueuedFieldReport;
  submitLabel: string;
  canSave?: boolean;
  isConnected?: boolean;
  canUseDemoSamples?: boolean;
  saveBlockedMessage?: string;
  onSave: (report: NewFieldReport) => Promise<void>;
};

export function FieldReportForm({
  initialReport,
  submitLabel,
  canSave = true,
  isConnected = true,
  canUseDemoSamples = false,
  saveBlockedMessage,
  onSave,
}: FieldReportFormProps) {
  const [photo, setPhoto] = useState<Blob | null>(initialReport?.photo ?? null);
  const [photoName, setPhotoName] = useState(initialReport?.photoName ?? "");
  const [photoType, setPhotoType] = useState(
    initialReport?.photoType ?? "image/webp",
  );
  const [capturedAt, setCapturedAt] = useState<string | null>(
    initialReport?.capturedAt ?? null,
  );
  const [isDemoSample, setIsDemoSample] = useState(
    initialReport?.isDemoSample ?? false,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState(
    initialReport ? String(initialReport.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    initialReport ? String(initialReport.longitude) : "",
  );
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(
    initialReport?.accuracyMeters ?? null,
  );
  const [locationMessage, setLocationMessage] = useState("");
  const [fieldNotes, setFieldNotes] = useState(initialReport?.fieldNotes ?? "");
  const [canalCondition, setCanalCondition] = useState<CanalCondition | "">(
    initialReport?.canalCondition ?? "",
  );
  const [canalObservation, setCanalObservation] = useState(
    initialReport?.canalObservation ?? "",
  );
  const [tags, setTags] = useState<string[]>(initialReport?.tags ?? []);
  const [aiConsent, setAiConsent] = useState(initialReport?.aiConsent ?? false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidField, setInvalidField] = useState<"photo" | "location" | null>(
    null,
  );
  const errorSummaryRef = useRef<HTMLParagraphElement>(null);
  const automaticLocationRequestRef = useRef<
    Promise<GeolocationPosition> | undefined
  >(undefined);
  const manualLocationEditedRef = useRef(false);
  const locationRequestVersion = useRef(0);
  const photoSelectionVersion = useRef(0);
  const demoSampleBlocked = isDemoSample && !canUseDemoSamples;
  const canSubmit = canSave && !demoSampleBlocked;
  const effectiveSaveBlockedMessage = demoSampleBlocked
    ? "Sampel demo hanya dapat dikirim oleh akun relawan demo lokal. Ganti dengan foto kejadian untuk melanjutkan."
    : saveBlockedMessage;

  useEffect(() => {
    const url = photo ? URL.createObjectURL(photo) : null;
    const frameId = window.requestAnimationFrame(() => setPreviewUrl(url));
    return () => {
      window.cancelAnimationFrame(frameId);
      if (url) URL.revokeObjectURL(url);
    };
  }, [photo]);

  async function selectPhoto(file: File | undefined) {
    if (!file) return;
    const selection = ++photoSelectionVersion.current;
    const selectedAt = new Date().toISOString();
    setErrorMessage("");
    setInvalidField(null);
    setIsCompressing(true);
    try {
      const compressed = await compressPhoto(file);
      if (selection !== photoSelectionVersion.current) return;
      setPhoto(compressed.blob);
      setPhotoName(compressed.fileName);
      setPhotoType(compressed.blob.type);
      setCapturedAt(selectedAt);
      if (isDemoSample) {
        locationRequestVersion.current += 1;
        manualLocationEditedRef.current = false;
        automaticLocationRequestRef.current = undefined;
        setLatitude("");
        setLongitude("");
        setAccuracyMeters(null);
        setLocationMessage(
          "Foto biasa dipilih. Ambil GPS atau masukkan koordinat kejadian.",
        );
      }
      setIsDemoSample(false);
    } catch (error) {
      if (selection !== photoSelectionVersion.current) return;
      setPhoto(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Foto tidak dapat diproses.",
      );
      setInvalidField("photo");
    } finally {
      if (selection === photoSelectionVersion.current) setIsCompressing(false);
    }
  }

  const requestLocation = useCallback(
    () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        const geolocation = navigator.geolocation;
        if (!geolocation) {
          reject(new Error("UNSUPPORTED"));
          return;
        }

        geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 60_000,
        });
      }),
    [],
  );

  const applyLocation = useCallback((position: GeolocationPosition) => {
    setLatitude(position.coords.latitude.toFixed(6));
    setLongitude(position.coords.longitude.toFixed(6));
    setAccuracyMeters(Math.round(position.coords.accuracy));
    setLocationMessage(
      `Lokasi didapat dengan akurasi sekitar ${Math.round(position.coords.accuracy)} meter.`,
    );
  }, []);

  const showLocationError = useCallback((error: unknown) => {
    if (error instanceof Error && error.message === "UNSUPPORTED") {
      setLocationMessage(
        "GPS tidak tersedia di browser ini. Masukkan koordinat secara manual.",
      );
      return;
    }

    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "number"
        ? error.code
        : null;
    const reason =
      code === 1
        ? "Izin lokasi ditolak. Masukkan koordinat secara manual jika mengetahui lokasinya."
        : code === 3
          ? "Permintaan lokasi terlalu lama. Coba lagi atau masukkan koordinat manual."
          : "Lokasi belum tersedia. Coba lagi atau masukkan koordinat manual.";
    setLocationMessage(reason);
  }, []);

  useEffect(() => {
    if (initialReport || isDemoSample) return;

    let active = true;
    const requestVersion = locationRequestVersion.current;
    automaticLocationRequestRef.current ??= requestLocation();
    void automaticLocationRequestRef.current
      .then((position) => {
        if (!active || requestVersion !== locationRequestVersion.current)
          return;
        if (manualLocationEditedRef.current) {
          setLocationMessage("Koordinat manual dipertahankan.");
          return;
        }
        applyLocation(position);
      })
      .catch((error: unknown) => {
        if (
          active &&
          requestVersion === locationRequestVersion.current &&
          !manualLocationEditedRef.current
        ) {
          showLocationError(error);
        }
      });

    return () => {
      active = false;
    };
  }, [
    applyLocation,
    initialReport,
    isDemoSample,
    requestLocation,
    showLocationError,
  ]);

  async function captureLocation() {
    const requestVersion = ++locationRequestVersion.current;
    manualLocationEditedRef.current = false;
    setInvalidField(null);
    setLocationMessage("Meminta lokasi perangkat…");
    try {
      const position = await requestLocation();
      if (
        requestVersion === locationRequestVersion.current &&
        !manualLocationEditedRef.current
      ) {
        applyLocation(position);
      }
    } catch (error) {
      if (
        requestVersion === locationRequestVersion.current &&
        !manualLocationEditedRef.current
      ) {
        showLocationError(error);
      }
    }
  }

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCompressing || isSaving) return;
    setErrorMessage("");
    setInvalidField(null);
    if (!canSubmit) {
      setErrorMessage(
        effectiveSaveBlockedMessage ??
          "Masuk online sekali untuk mengaktifkan laporan offline.",
      );
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!photo) {
      setErrorMessage("Tambahkan foto temuan dari kamera atau galeri.");
      setInvalidField("photo");
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lon) ||
      lon < -180 ||
      lon > 180
    ) {
      setErrorMessage("Masukkan koordinat lintang dan bujur yang valid.");
      setInvalidField("location");
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        capturedAt: capturedAt ?? new Date().toISOString(),
        latitude: lat,
        longitude: lon,
        accuracyMeters,
        fieldNotes: fieldNotes.trim(),
        canalCondition: canalCondition || undefined,
        canalObservation: canalCondition ? canalObservation.trim() : undefined,
        tags,
        aiConsent,
        isDemoSample,
        photo,
        photoName,
        photoType,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Laporan belum dapat disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Validate compressed Blob photos and coordinates together before saving locally.
  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
      <div className={fieldCaptureGrid}>
        <FieldReportPhotoField
          previewUrl={previewUrl}
          isDemoSample={isDemoSample}
          invalid={invalidField === "photo"}
          isCompressing={isCompressing}
          selectPhoto={selectPhoto}
        />
        <FieldReportLocationField
          isConnected={isConnected}
          invalid={invalidField === "location"}
          latitude={latitude}
          longitude={longitude}
          locationMessage={locationMessage}
          accuracyMeters={accuracyMeters}
          isDemoSample={isDemoSample}
          captureLocation={captureLocation}
          onCoordinatesChange={(latitude, longitude) => {
            manualLocationEditedRef.current = true;
            setLatitude(latitude);
            setLongitude(longitude);
            setAccuracyMeters(null);
            setLocationMessage(
              "Koordinat dipilih manual. Akurasi GPS tidak berlaku.",
            );
            setInvalidField(null);
          }}
        />
      </div>
      <FieldReportNotesField
        fieldNotes={fieldNotes}
        tags={tags}
        onNotesChange={setFieldNotes}
        onToggleTag={toggleTag}
      />

      <fieldset className="space-y-3 rounded-xl border border-border bg-white p-4">
        <legend className="px-1 text-sm font-semibold">
          Observasi sekat kanal (opsional)
        </legend>
        <label className="block text-sm">
          Kondisi sekat kanal
          <select
            className="mt-1 block min-h-11 w-full rounded-lg border px-2"
            value={canalCondition}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setCanalCondition(isCanalCondition(value) ? value : "");
            }}
          >
            <option value="">Tidak ada observasi</option>
            {CANAL_CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {CANAL_CONDITION_LABELS[condition]}
              </option>
            ))}
          </select>
        </label>
        {canalCondition ? (
          <label className="block text-sm">
            Catatan kondisi
            <textarea
              className="mt-1 block w-full rounded-lg border p-2"
              rows={2}
              maxLength={500}
              value={canalObservation}
              onChange={(event) =>
                setCanalObservation(event.currentTarget.value)
              }
            />
          </label>
        ) : null}
      </fieldset>

      <div className={fieldFormActionsGrid}>
        <div className="min-w-0 self-center">
          <label className="inline-flex min-h-7 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={aiConsent}
              onChange={(event) => setAiConsent(event.target.checked)}
              aria-describedby="field-ai-consent-description"
              className="size-5 shrink-0 accent-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
            />
            <Sparkles
              aria-hidden="true"
              className="shrink-0 text-peat-green"
              size={16}
            />
            <span className="min-w-0 text-sm leading-6 font-semibold text-peat-forest">
              Izinkan analisis foto dengan AI{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (opsional)
              </span>
            </span>
          </label>
          <p
            id="field-ai-consent-description"
            className="mt-1 pl-7 text-xs leading-5 text-muted-foreground"
          >
            AI akan menganalisis foto setelah posko menerima laporan, jika Anda
            memberi izin.
          </p>
        </div>

        <div className={fieldFormSaveArea}>
          {errorMessage ? (
            <p
              id="form-error"
              ref={errorSummaryRef}
              tabIndex={-1}
              className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive focus-visible:outline-3 focus-visible:outline-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          {!canSave && saveBlockedMessage ? (
            <p
              className="mb-3 rounded-xl border border-peat-forest/15 bg-white p-3 text-sm text-muted-foreground"
              role="status"
            >
              {saveBlockedMessage}
            </p>
          ) : null}
          {demoSampleBlocked ? (
            <p
              className="mb-3 rounded-xl border border-peat-forest/15 bg-white p-3 text-sm text-muted-foreground"
              role="status"
            >
              {effectiveSaveBlockedMessage}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <p className="max-w-68 flex-1 basis-44 text-xs leading-5 text-muted-foreground">
              Disimpan di perangkat, lalu dikirim saat koneksi tersedia.
            </p>
            <button
              type="submit"
              disabled={isSaving || isCompressing || !canSubmit}
              className="ml-auto inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Menyimpan laporan…"
                : !canSave
                  ? "Akun belum diverifikasi"
                  : demoSampleBlocked
                    ? "Ganti foto sampel"
                    : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
