import type { MrvGeneratedReport } from "@/lib/server/mrv/contracts";

export function NarrativeSection({ report }: { report: MrvGeneratedReport }) {
  if (report.narrative.status === "not_requested") {
    return (
      <p className="rounded-xl bg-peat-paper p-4 text-sm text-muted-foreground">
        Draf narasi AI tidak diminta. Angka laporan tetap dihitung oleh server.
      </p>
    );
  }

  if (report.narrative.status === "unavailable") {
    const reason = {
      CONSENT_REQUIRED: "Persetujuan AI belum diberikan.",
      INSUFFICIENT_AGGREGATE_REPORTS:
        "Narasi tidak dibuat karena jumlah laporan non-demo belum mencukupi.",
      NARRATIVE_PROVIDER_FAILED:
        "Layanan narasi sedang tidak tersedia. Angka kanonis tetap berasal dari database.",
      NARRATIVE_PROVIDER_NOT_CONFIGURED:
        "Layanan narasi belum dikonfigurasi. Angka kanonis tetap berasal dari database.",
    }[report.narrative.reason];

    return (
      <p className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-sm leading-6 text-foreground">
        {reason}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-heading text-xl font-bold text-peat-forest">
          {report.narrative.headline}
        </h4>
        <p className="mt-2 text-sm leading-6 text-foreground">
          {report.narrative.narrative}
        </p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-peat-forest">
          Prioritas tindak lanjut
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-foreground">
          {report.narrative.recommendations.map((recommendation, index) => (
            <li key={`${index}-${recommendation}`}>{recommendation}</li>
          ))}
        </ul>
      </div>
      <p className="border-l-2 border-peat-sun pl-3 text-xs leading-5 text-muted-foreground">
        Draf narasi bersifat kualitatif dan harus ditinjau. Nilai angka di atas
        tetap dihitung server dan tidak diubah oleh AI.
      </p>
    </div>
  );
}
