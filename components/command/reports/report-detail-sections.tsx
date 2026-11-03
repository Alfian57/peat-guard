import Image from "next/image";
import { Clock3, Droplets, MapPinned, ShieldCheck } from "lucide-react";

import {
  AiStateLabel,
  ReportCategoryLabel,
  ReportStatusBadge,
  ReportUrgencyBadge,
} from "@/components/command/reports/report-status-badge";
import type {
  ReportDetail,
  ReportStatusEvent,
} from "@/components/command/reports/report-contracts";
import { formatDate } from "@/components/command/reports/report-card";

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

export function ReportAiAnalysis({ report }: { report: ReportDetail }) {
  return (
    <section
      aria-labelledby="report-ai-heading"
      className="rounded-2xl border border-peat-forest/10 bg-white p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className="font-heading text-2xl font-bold text-peat-forest"
            id="report-ai-heading"
          >
            Analisis visual AI
          </h2>
          <p className="mt-1 text-xs text-peat-forest/65">
            <AiStateLabel state={report.aiState} />
            {report.aiAnalyzedAt
              ? " · dianalisis " + formatDate(report.aiAnalyzedAt)
              : ""}
          </p>
        </div>
        {report.aiConfidence === null ? null : (
          <p className="text-sm font-semibold text-peat-green">
            Keyakinan {Math.round(report.aiConfidence * 100)}%
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-peat-paper px-3 py-2 text-sm font-semibold text-peat-forest">
          <ReportCategoryLabel category={report.aiCategory} />
        </span>
        <ReportUrgencyBadge urgency={report.aiUrgency} />
      </div>

      {report.aiSummary ? (
        <p className="mt-4 text-sm leading-6 text-peat-forest/80">
          {report.aiSummary}
        </p>
      ) : null}
      {report.aiVisualIndicators?.length ? (
        <TextList
          heading="Indikator visual"
          values={report.aiVisualIndicators}
        />
      ) : null}
      {report.aiFalsePositiveCheck ? (
        <div className="mt-4 rounded-xl border border-blue-900/10 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-950">
            <ShieldCheck aria-hidden="true" size={16} />
            Pemeriksaan kemungkinan positif palsu
          </div>
          <p className="mt-2 text-sm leading-6 text-blue-950/80">
            {report.aiFalsePositiveCheck}
          </p>
        </div>
      ) : null}
      {report.aiActionRecommendations?.length ? (
        <TextList
          heading="Saran tindak lanjut"
          values={report.aiActionRecommendations}
        />
      ) : null}
      {report.aiConsent ? null : (
        <p className="mt-4 rounded-xl bg-peat-paper p-3 text-xs leading-5 text-peat-forest/70">
          Analisis visual dilewati karena tidak ada persetujuan AI pada saat
          laporan dibuat.
        </p>
      )}
    </section>
  );
}

export function ReportLocationDetails({
  report,
  zoneName,
}: {
  report: ReportDetail;
  zoneName: string | null;
}) {
  return (
    <section
      aria-labelledby="report-location-heading"
      className="rounded-2xl border border-peat-forest/10 bg-white p-4"
    >
      <h2
        className="font-heading text-2xl font-bold text-peat-forest"
        id="report-location-heading"
      >
        Lokasi dan waktu
      </h2>
      <dl className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <Detail
          icon={<MapPinned aria-hidden="true" size={15} />}
          label="Koordinat"
          value={
            <span className="font-mono">
              {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
            </span>
          }
        />
        <Detail
          label="Akurasi GPS"
          value={
            report.accuracyMeters === null
              ? "Tidak tersedia"
              : "±" + Math.round(report.accuracyMeters) + " m"
          }
        />
        <Detail label="Zona" value={zoneName ?? "Belum ditetapkan"} />
        <Detail
          icon={<Droplets aria-hidden="true" size={15} />}
          label="Jarak sumber air terdekat"
          value={
            report.nearestWaterDistanceM === null
              ? "Tidak tersedia"
              : Math.round(report.nearestWaterDistanceM) + " m"
          }
        />
        <Detail
          icon={<Clock3 aria-hidden="true" size={15} />}
          label="Waktu direkam"
          value={formatDate(report.capturedAt)}
        />
        <Detail
          label="Waktu diterima POSKO"
          value={formatDate(report.syncedAt)}
        />
      </dl>
    </section>
  );
}

export function ReportStatusHistory({
  events,
}: {
  events: ReportStatusEvent[];
}) {
  return (
    <section
      aria-labelledby="report-history-heading"
      className="rounded-2xl border border-peat-forest/10 bg-white p-4"
    >
      <h2
        className="font-heading text-2xl font-bold text-peat-forest"
        id="report-history-heading"
      >
        Riwayat status
      </h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-peat-forest/65">
          Belum ada perubahan status.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {events.map((event) => (
            <li
              className="relative border-l-2 border-peat-leaf pl-4"
              key={event.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                {event.previousStatus ? (
                  <>
                    <ReportStatusBadge status={event.previousStatus} />
                    <span aria-hidden="true" className="text-peat-forest/45">
                      →
                    </span>
                  </>
                ) : null}
                <ReportStatusBadge status={event.nextStatus} />
              </div>
              <p className="mt-1 text-xs text-peat-forest/60">
                {formatDate(event.createdAt)}
              </p>
              {event.note ? (
                <p className="mt-2 text-sm leading-5 whitespace-pre-wrap text-peat-forest/75">
                  {event.note}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function TextList({ heading, values }: { heading: string; values: string[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-peat-forest">{heading}</h3>
      <ul className="mt-2 space-y-2">
        {values.map((value, index) => (
          <li
            className="flex gap-2 text-sm leading-5 text-peat-forest/80"
            key={index}
          >
            <span aria-hidden="true" className="font-semibold text-peat-green">
              {index + 1}.
            </span>
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-peat-forest/60">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-peat-forest">{value}</dd>
    </div>
  );
}
