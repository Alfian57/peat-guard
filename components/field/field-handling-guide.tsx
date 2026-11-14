import { handlingStatusLabel } from "@/lib/report-labels";
import type { ServerHandlingStatus } from "@/lib/client/offline/server-report-client";
import { handlingClasses } from "./field-report-presentation";

const descriptions: Record<ServerHandlingStatus, string> = {
  MENUNGGU_TINDAKAN: "Laporan sudah diterima dan menunggu tindakan posko.",
  DALAM_PENANGANAN: "Posko sedang menangani laporan Anda.",
  SELESAI: "Posko telah menyelesaikan penanganan laporan.",
};
const statuses = [
  "MENUNGGU_TINDAKAN",
  "DALAM_PENANGANAN",
  "SELESAI",
] as const satisfies readonly ServerHandlingStatus[];

export function FieldHandlingGuide() {
  return (
    <section
      aria-labelledby="field-handling-title"
      className="min-w-0 rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs"
    >
      <h2
        id="field-handling-title"
        className="font-heading text-2xl font-bold text-peat-forest"
      >
        Arti status laporan
      </h2>
      <dl className="mt-1 divide-y divide-peat-forest/10">
        {statuses.map((status) => (
          <div
            key={status}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
          >
            <dt className="min-w-32">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${handlingClasses[status]}`}
              >
                {handlingStatusLabel(status)}
              </span>
            </dt>
            <dd className="flex-1 basis-40 text-xs leading-5 text-muted-foreground">
              {descriptions[status]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
