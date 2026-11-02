import type {
  ApprovedZoneValues,
  LedgerFilters,
} from "@/lib/server/mrv/contracts";

type LedgerFilterFormProps = {
  aiState: LedgerFilters["aiState"];
  evidence: LedgerFilters["evidence"];
  from: string;
  to: string;
  zoneId: string | null;
  zones: ApprovedZoneValues[];
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function LedgerFilterForm({
  aiState,
  evidence,
  from,
  to,
  zoneId,
  zones,
}: LedgerFilterFormProps) {
  return (
    <form
      action="/audit/ledger"
      className="audit-hide-on-print rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5"
      method="get"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-peat-forest"
            htmlFor="ledger-zone"
          >
            Wilayah zona
          </label>
          <select
            className={fieldClassName}
            defaultValue={zoneId ?? ""}
            id="ledger-zone"
            name="zoneId"
          >
            <option value="">Semua zona</option>
            {zones.map((zone) => (
              <option key={zone.zoneId} value={zone.zoneId}>
                {zone.zoneName}
                {zone.villageName ? ` · ${zone.villageName}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-peat-forest"
            htmlFor="ledger-evidence"
          >
            Kelengkapan bukti
          </label>
          <select
            className={fieldClassName}
            defaultValue={evidence}
            id="ledger-evidence"
            name="evidence"
          >
            <option value="all">Semua laporan</option>
            <option value="complete">
              Koordinat, foto, dan triase AI tersedia
            </option>
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-peat-forest"
            htmlFor="ledger-ai-state"
          >
            Status triase AI
          </label>
          <select
            className={fieldClassName}
            defaultValue={aiState ?? ""}
            id="ledger-ai-state"
            name="aiState"
          >
            <option value="">Semua status</option>
            <option value="COMPLETED">Selesai</option>
            <option value="PENDING">Menunggu</option>
            <option value="FAILED">Gagal</option>
            <option value="SKIPPED">Tidak dianalisis</option>
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-peat-forest"
            htmlFor="ledger-from"
          >
            Dari tanggal
          </label>
          <input
            className={fieldClassName}
            id="ledger-from"
            max={to || undefined}
            name="from"
            required={Boolean(to)}
            type="date"
            defaultValue={from}
          />
        </div>
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-peat-forest"
            htmlFor="ledger-to"
          >
            Sampai tanggal
          </label>
          <input
            className={fieldClassName}
            id="ledger-to"
            min={from || undefined}
            name="to"
            required={Boolean(from)}
            type="date"
            defaultValue={to}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="min-h-11 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white transition hover:bg-peat-green"
          type="submit"
        >
          Terapkan filter
        </button>
        <a
          className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-peat-green underline-offset-4 hover:underline"
          href="/audit/ledger"
        >
          Atur ulang
        </a>
        <p className="basis-full text-xs leading-5 text-muted-foreground sm:flex-1 sm:basis-auto">
          Filter bukti menunjukkan kelengkapan data tersimpan, bukan verifikasi
          lokasi GPS.
        </p>
      </div>
    </form>
  );
}
