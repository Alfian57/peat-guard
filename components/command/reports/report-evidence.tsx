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
      className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white"
    >
      <div className="flex items-center justify-between gap-3 border-b border-peat-forest/10 px-4 py-3">
        <h2
          className="font-heading text-2xl font-bold text-peat-forest"
          id="report-evidence-heading"
        >
          Bukti lapangan
        </h2>
        {report.isDemoSample ? (
          <span className="rounded-full bg-peat-sun/25 px-3 py-1 text-xs font-semibold text-peat-forest">
            Sampel demo
          </span>
        ) : null}
      </div>
      <div className="p-4">
        {photoAvailable ? (
          <Image
            alt="Foto bukti yang dilampirkan pada laporan lapangan"
            className="max-h-[560px] w-full rounded-xl bg-peat-paper object-contain"
            height={720}
            onError={onPhotoError}
            src={report.photoHref}
            unoptimized
            width={960}
          />
        ) : (
          <div
            aria-live="polite"
            className="grid min-h-48 place-items-center rounded-xl border border-dashed border-peat-forest/20 bg-peat-paper p-5 text-center text-sm text-peat-forest/65"
            role="status"
          >
            Bukti foto tidak tersedia.
          </div>
        )}
        <div className="mt-4 rounded-xl bg-peat-paper p-4">
          <h3 className="text-sm font-semibold text-peat-forest">
            Catatan lapangan
          </h3>
          <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-peat-forest/80">
            {report.fieldNotes || "Tidak ada catatan lapangan."}
          </p>
          {report.tags.length > 0 ? (
            <ul aria-label="Tag laporan" className="mt-3 flex flex-wrap gap-2">
              {report.tags.map((tag) => (
                <li
                  className="rounded-full border border-peat-forest/15 bg-white px-3 py-1 text-xs text-peat-forest/75"
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
