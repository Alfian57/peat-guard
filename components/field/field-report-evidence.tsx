import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export function FieldReportEvidence({
  photoHref,
  photoMessage,
  isPhotoLoading = false,
  isDemoSample,
  fieldNotes,
  tags,
  onPhotoError,
}: {
  photoHref: string | null;
  photoMessage: string;
  isPhotoLoading?: boolean;
  isDemoSample: boolean;
  fieldNotes: string | null;
  tags: string[];
  onPhotoError?: () => void;
}) {
  return (
    <section
      aria-labelledby="field-evidence-heading"
      className="min-w-0 overflow-hidden rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs"
    >
      <h2
        className="font-heading text-2xl font-bold text-peat-forest"
        id="field-evidence-heading"
      >
        Bukti lapangan
      </h2>
      <div className="mt-2 overflow-hidden rounded-xl bg-peat-paper">
        {photoHref ? (
          <Image
            src={photoHref}
            alt={
              isDemoSample
                ? "Foto sampel demo, bukan bukti kejadian"
                : "Foto laporan patroli"
            }
            width={960}
            height={720}
            unoptimized
            onError={onPhotoError}
            className="h-auto max-h-80 w-full object-contain 2xl:max-h-96"
          />
        ) : isPhotoLoading ? (
          <Skeleton
            role="status"
            aria-label={photoMessage}
            className="aspect-[4/3] max-h-80 w-full rounded-none bg-peat-forest/10 motion-reduce:animate-none 2xl:max-h-96"
          />
        ) : (
          <p className="grid min-h-36 place-items-center p-4 text-center text-sm text-muted-foreground">
            {photoMessage}
          </p>
        )}
      </div>
      {isDemoSample ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Foto sampel, bukan bukti kejadian nyata.
        </p>
      ) : null}
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-peat-forest">
          Catatan lapangan
        </h3>
        <p className="mt-2 text-sm leading-6 wrap-anywhere whitespace-pre-wrap text-peat-forest/80">
          {fieldNotes || "Tidak ada catatan lapangan."}
        </p>
        {tags.length > 0 ? (
          <ul aria-label="Tag laporan" className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                className="max-w-full rounded-full bg-peat-paper px-2.5 py-1 text-xs wrap-anywhere text-muted-foreground"
                key={tag}
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
