"use client";

import Image from "next/image";
import { Camera, Check, MapPin, Sparkles, Upload } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { compressPhoto } from "@/lib/client/offline/compress-photo";
import { MapCoordinatePicker } from "@/components/maps/map-coordinate-picker";
import type {
  NewFieldReport,
  QueuedFieldReport,
} from "@/lib/client/offline/types";

const TAG_OPTIONS = [
  "Asap",
  "Kanal",
  "Vegetasi",
  "Satwa",
  "Aktivitas manusia",
  "Lainnya",
];
const DEMO_SAMPLES = [
  {
    id: "asap-gambut",
    label: "Asap gambut",
    image: "/samples/asap-gambut.webp",
  },
  {
    id: "kanal-kering",
    label: "Kanal kering",
    image: "/samples/kanal-kering.webp",
  },
  { id: "hutan-aman", label: "Hutan aman", image: "/samples/hutan-aman.webp" },
] as const;

type FieldReportFormProps = {
  initialReport?: QueuedFieldReport;
  submitLabel: string;
  canSave?: boolean;
  canUseDemoSamples?: boolean;
  saveBlockedMessage?: string;
  onSave: (report: NewFieldReport) => Promise<void>;
};

export function FieldReportForm({
  initialReport,
  submitLabel,
  canSave = true,
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
    const selectedAt = new Date().toISOString();
    setErrorMessage("");
    setInvalidField(null);
    setIsCompressing(true);
    try {
      const compressed = await compressPhoto(file);
      setPhoto(compressed.blob);
      setPhotoName(compressed.fileName);
      setPhotoType(compressed.blob.type);
      setCapturedAt(selectedAt);
      if (isDemoSample) {
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
      setErrorMessage(
        error instanceof Error ? error.message : "Foto tidak dapat diproses.",
      );
      setInvalidField("photo");
    } finally {
      setIsCompressing(false);
    }
  }

  async function selectSample(sample: (typeof DEMO_SAMPLES)[number]) {
    if (!canUseDemoSamples) return;
    const selectedAt = new Date().toISOString();
    setErrorMessage("");
    setInvalidField(null);
    setIsCompressing(true);
    try {
      const response = await fetch(sample.image, { cache: "force-cache" });
      if (!response.ok)
        throw new Error(
          "Sampel demo tidak tersedia. Coba lagi saat terhubung.",
        );
      const sampleBlob = await response.blob();
      setPhoto(sampleBlob);
      setPhotoName(`${sample.id}.webp`);
      setPhotoType(sampleBlob.type || "image/webp");
      setCapturedAt(selectedAt);
      setIsDemoSample(true);
      manualLocationEditedRef.current = false;
      setLocationMessage(
        "Lokasi demo terpilih. Ubah koordinat untuk mencatat lokasi lain.",
      );
      setLatitude("-2.3194");
      setLongitude("113.9102");
      setAccuracyMeters(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Sampel demo tidak dapat dibuka.",
      );
    } finally {
      setIsCompressing(false);
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
    automaticLocationRequestRef.current ??= requestLocation();
    void automaticLocationRequestRef.current
      .then((position) => {
        if (!active) return;
        if (manualLocationEditedRef.current) {
          setLocationMessage("Koordinat manual dipertahankan.");
          return;
        }
        applyLocation(position);
      })
      .catch((error: unknown) => {
        if (active) showLocationError(error);
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
    manualLocationEditedRef.current = false;
    setInvalidField(null);
    setLocationMessage("Meminta lokasi perangkat…");
    try {
      applyLocation(await requestLocation());
    } catch (error) {
      showLocationError(error);
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
      setErrorMessage(
        "Tambahkan foto temuan atau pilih salah satu sampel demo.",
      );
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

  // noValidate lets the custom handler accept demo Blob photos and report
  // accessible photo/coordinate errors together before saving locally.
  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <section
        role="group"
        aria-labelledby="photo-title"
        aria-describedby={invalidField === "photo" ? "form-error" : undefined}
      >
        <h2
          id="photo-title"
          className="font-heading text-2xl font-bold text-peat-forest"
        >
          Foto temuan{" "}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Foto dikompres di perangkat ke maksimal 1280 piksel. Waktu laporan
          dicatat saat foto dipilih atau kembali dari kamera, bukan dari waktu
          rana pada metadata foto.
        </p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-white">
          <div className="relative grid min-h-48 place-items-center bg-secondary/60">
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt={
                    isDemoSample
                      ? "Pratinjau foto sampel demo"
                      : "Pratinjau foto laporan"
                  }
                  fill
                  unoptimized
                  className="object-cover"
                />
                {isDemoSample ? (
                  <span className="absolute top-3 left-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">
                    Sampel demo
                  </span>
                ) : null}
              </>
            ) : (
              <div className="p-5 text-center text-muted-foreground">
                <Camera
                  aria-hidden="true"
                  className="mx-auto text-peat-green"
                  size={32}
                />
                <p className="mt-2 text-sm">Belum ada foto dipilih</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-peat-forest focus-within:outline-3 focus-within:outline-peat-green">
              <Camera aria-hidden="true" size={18} /> Ambil foto
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                capture="environment"
                aria-invalid={invalidField === "photo"}
                onChange={(event) => {
                  void selectPhoto(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-peat-forest focus-within:outline-3 focus-within:outline-peat-green">
              <Upload aria-hidden="true" size={18} /> Galeri
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                aria-invalid={invalidField === "photo"}
                onChange={(event) => {
                  void selectPhoto(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </div>
        {canUseDemoSamples ? (
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-peat-forest">
              Coba dengan sampel demo
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DEMO_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => void selectSample(sample)}
                  aria-pressed={
                    isDemoSample && photoName === `${sample.id}.webp`
                  }
                  className="overflow-hidden rounded-xl border border-border bg-white text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
                >
                  <span className="relative block aspect-square">
                    <Image
                      src={sample.image}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 30vw, 120px"
                      className="object-cover"
                    />
                  </span>
                  <span className="block px-2 py-2 text-[11px] leading-tight font-semibold text-peat-forest">
                    Sampel demo · {sample.label}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            Sampel demo hanya tersedia untuk akun relawan demo lokal.
          </p>
        )}
        {isCompressing ? (
          <p className="mt-2 text-sm text-muted-foreground" role="status">
            Menyiapkan foto…
          </p>
        ) : null}
      </section>

      <section
        role="group"
        aria-labelledby="location-title"
        aria-describedby={
          invalidField === "location" ? "form-error" : undefined
        }
        className="rounded-2xl border border-border bg-white p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="location-title"
              className="font-heading text-2xl font-bold text-peat-forest"
            >
              Lokasi
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lokasi membantu posko menindaklanjuti temuan. GPS dicoba otomatis;
              jika izin ditolak, masukkan koordinat secara manual.
            </p>
          </div>
          <button
            type="button"
            onClick={captureLocation}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-secondary px-3 text-sm font-semibold text-peat-forest focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
          >
            <MapPin aria-hidden="true" size={17} /> Ambil GPS
          </button>
        </div>
        {locationMessage ? (
          <p className="mt-3 text-sm text-peat-forest" role="status">
            {locationMessage}
          </p>
        ) : null}
        {isDemoSample ? (
          <p className="mt-2 text-xs font-semibold text-amber-900">
            Laporan ini memakai foto sampel demo, bukan bukti kejadian nyata.
          </p>
        ) : null}
        <div className="mt-4">
          <MapCoordinatePicker
            heightClassName="h-56 sm:h-64"
            hint="Klik pada peta untuk menempatkan atau memindahkan titik koordinat laporan."
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
              manualLocationEditedRef.current = true;
              setLatitude(nextLat.toFixed(6));
              setLongitude(nextLng.toFixed(6));
              setInvalidField(null);
            }}
            pointKind="report"
            showCurrentLocationButton={false}
            title="Tentukan titik laporan di peta"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-peat-forest">
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
              aria-invalid={invalidField === "location"}
              inputMode="decimal"
              value={latitude}
              onChange={(event) => {
                manualLocationEditedRef.current = true;
                setLatitude(event.target.value);
                setInvalidField(null);
              }}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-peat-green"
              placeholder="-2.319400"
            />
          </label>
          <label className="text-xs font-semibold text-peat-forest">
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
              aria-invalid={invalidField === "location"}
              inputMode="decimal"
              value={longitude}
              onChange={(event) => {
                manualLocationEditedRef.current = true;
                setLongitude(event.target.value);
                setInvalidField(null);
              }}
              className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-peat-green"
              placeholder="113.910200"
            />
          </label>
        </div>
        {accuracyMeters !== null ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Akurasi GPS sekitar {accuracyMeters} meter.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="notes-title">
        <h2
          id="notes-title"
          className="font-heading text-2xl font-bold text-peat-forest"
        >
          Catatan lapangan
        </h2>
        <fieldset className="mt-2">
          <legend className="text-sm text-muted-foreground">
            Pilih kategori temuan{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (opsional)
            </span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
                className={`min-h-10 rounded-full border px-3 text-sm focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-peat-green ${tags.includes(tag) ? "border-peat-green bg-peat-green text-white" : "border-border bg-white text-peat-forest"}`}
              >
                {tags.includes(tag) ? (
                  <Check aria-hidden="true" className="mr-1 inline" size={14} />
                ) : null}
                {tag}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="mt-4 block text-sm font-semibold text-peat-forest">
          Keterangan tambahan{" "}
          <span className="font-normal text-muted-foreground">(opsional)</span>
          <textarea
            value={fieldNotes}
            onChange={(event) => setFieldNotes(event.target.value)}
            maxLength={1000}
            rows={4}
            className="mt-1 w-full resize-y rounded-xl border border-border bg-white p-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-peat-green"
            placeholder="Jelaskan kondisi sekitar, waktu pengamatan, atau tindak lanjut yang diperlukan..."
          />
        </label>
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {fieldNotes.length}/1000
        </p>
      </section>

      <section className="rounded-2xl border border-peat-green/20 bg-secondary/55 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={aiConsent}
            onChange={(event) => setAiConsent(event.target.checked)}
            className="mt-1 size-5 accent-peat-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
          />
          <span>
            <span className="flex items-center gap-2 font-semibold text-peat-forest">
              <Sparkles aria-hidden="true" size={17} /> Izinkan analisis foto
              dengan AI{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (opsional)
              </span>
            </span>
            <span className="mt-1 block text-sm leading-5 text-muted-foreground">
              Foto hanya dianalisis jika Anda memberi izin. Tanpa izin, laporan
              tetap tersimpan dan analisis dilewati.
            </span>
          </span>
        </label>
      </section>

      {errorMessage ? (
        <p
          id="form-error"
          ref={errorSummaryRef}
          tabIndex={-1}
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive focus-visible:outline-3 focus-visible:outline-destructive"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      {!canSave && saveBlockedMessage ? (
        <p
          className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950"
          role="status"
        >
          {saveBlockedMessage}
        </p>
      ) : null}
      {demoSampleBlocked ? (
        <p
          className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950"
          role="status"
        >
          {effectiveSaveBlockedMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSaving || isCompressing || !canSubmit}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-peat-green px-4 text-base font-bold text-white shadow-sm transition hover:bg-peat-forest focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-peat-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving
          ? "Menyimpan laporan…"
          : !canSave
            ? "Akun belum diverifikasi"
            : demoSampleBlocked
              ? "Ganti foto sampel"
              : submitLabel}
      </button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Laporan disimpan di perangkat ini terlebih dahulu. Sinkronisasi akan
        mencoba saat koneksi tersedia.
      </p>
    </form>
  );
}
