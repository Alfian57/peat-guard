import Image from "next/image";

import type { ReportDetail } from "@/components/command/reports/report-contracts";

export function ReportEvidence({
  onPhotoError,
  photoAvailable,
  report,
}: {
  onPhotoError: () => void;
  photoAvailable: boolean;
  report: ReportDetail;
}) {
  return (
    <section
      aria-labelledby="report-evidence-heading"
      className="min-w-0 overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs"
    >
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2
          className="font-heading text-2xl font-bold text-peat-forest"
          id="report-evidence-heading"
        >
          Bukti lapangan
        </h2>
      </div>
      <div className="p-5 pt-4 sm:p-6 sm:pt-4">
        {photoAvailable ? (
          <Image
            alt="Foto bukti yang dilampirkan pada laporan lapangan"
            className="h-auto max-h-[440px] w-full rounded-xl bg-peat-paper object-contain"
            height={720}
            onError={onPhotoError}
            src={report.photoHref}
            unoptimized
            width={960}
          />
        ) : (
          <div
            aria-live="polite"
            className="grid min-h-48 place-items-center rounded-xl border border-dashed border-peat-forest/20 bg-peat-paper p-5 text-center text-sm text-muted-foreground"
            role="status"
          >
            Bukti foto tidak tersedia.
          </div>
        )}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-peat-forest">
            Catatan lapangan
          </h3>
          <p className="mt-2 text-sm leading-6 wrap-anywhere whitespace-pre-wrap text-peat-forest/80">
            {report.fieldNotes || "Tidak ada catatan lapangan."}
          </p>
          {report.tags.length > 0 ? (
            <ul aria-label="Tag laporan" className="mt-3 flex flex-wrap gap-2">
              {report.tags.map((tag) => (
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
      </div>
    </section>
  );
}
