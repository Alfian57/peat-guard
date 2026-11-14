import Image from "next/image";
import { Camera, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fieldCapturePanel,
  fieldPhotoPreviewHeight,
} from "./field-report-layout";

export function FieldReportPhotoField({
  previewUrl,
  isDemoSample,
  invalid,
  isCompressing,
  selectPhoto,
}: {
  previewUrl: string | null;
  isDemoSample: boolean;
  invalid: boolean;
  isCompressing: boolean;
  selectPhoto: (file?: File) => Promise<void>;
}) {
  return (
    <section
      role="group"
      aria-labelledby="photo-title"
      className={`flex flex-col ${fieldCapturePanel}`}
      aria-describedby={invalid ? "form-error" : undefined}
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
        Gunakan foto kondisi di lapangan. Waktu laporan dicatat saat foto
        dipilih.
      </p>
      <div className="mt-3 flex flex-1 flex-col overflow-hidden rounded-xl border border-peat-forest/10 bg-white">
        <div
          className={`relative grid flex-1 place-items-center bg-peat-paper ${fieldPhotoPreviewHeight}`}
        >
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
                className="object-contain"
              />
              {isDemoSample ? (
                <span className="absolute top-3 left-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">
                  Sampel demo
                </span>
              ) : null}
            </>
          ) : isCompressing ? (
            <Skeleton
              aria-hidden="true"
              className="absolute inset-0 rounded-none bg-peat-forest/10 motion-reduce:animate-none"
            />
          ) : (
            <div className="p-5 text-center text-muted-foreground">
              <Camera
                aria-hidden="true"
                className="mx-auto text-peat-green"
                size={26}
              />
              <p className="mt-2 text-sm">Belum ada foto dipilih</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 p-2">
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-2 text-sm font-semibold text-peat-forest focus-within:outline-3 focus-within:outline-peat-green hover:bg-peat-paper">
            <Camera aria-hidden="true" size={16} /> Ambil foto
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              aria-invalid={invalid}
              onChange={(event) => {
                void selectPhoto(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-2 text-sm font-semibold text-peat-forest focus-within:outline-3 focus-within:outline-peat-green hover:bg-peat-paper">
            <Upload aria-hidden="true" size={16} /> Galeri
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-invalid={invalid}
              onChange={(event) => {
                void selectPhoto(event.currentTarget.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>
      {isCompressing ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          Menyiapkan foto…
        </p>
      ) : null}
    </section>
  );
}
