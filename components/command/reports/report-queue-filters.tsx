import type { FormEvent } from "react";
import type { CommandZone } from "@/lib/server/zones/data";
import type { ReportFilters } from "@/components/command/reports/report-query";
import type { ReportStatus } from "@/components/command/reports/report-contracts";
import { statusLabel } from "@/components/command/reports/report-status-badge";
import { REPORT_STATUSES } from "@/components/command/reports/report-contracts";

const controlClassName =
  "min-h-11 w-full rounded-xl border border-peat-forest/15 bg-white px-3 text-sm text-peat-forest";

export type ReportStatusCounts = Record<ReportStatus | "all", number | null>;

export function ReportQueueFilters({
  counts,
  draftFilters,
  error,
  isLoading,
  onApply,
  onDraftChange,
  onReset,
  onStatusChange,
  selectedStatus,
  zones,
}: {
  counts: ReportStatusCounts;
  draftFilters: ReportFilters;
  error: string;
  isLoading: boolean;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
  onDraftChange: (filters: ReportFilters) => void;
  onReset: () => void;
  onStatusChange: (status: ReportStatus | null) => void;
  selectedStatus: ReportStatus | null;
  zones: CommandZone[];
}) {
  return (
    <div className="space-y-4">
      <div
        aria-label="Filter status laporan"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-peat-forest/10 bg-white p-2 sm:grid-cols-4"
        role="group"
      >
        <StatusTab
          count={counts.all}
          isSelected={selectedStatus === null}
          label="Semua laporan"
          onSelect={() => onStatusChange(null)}
        />
        {REPORT_STATUSES.map((status) => (
          <StatusTab
            count={counts[status]}
            isSelected={selectedStatus === status}
            key={status}
            label={statusLabel(status)}
            onSelect={() => onStatusChange(status)}
          />
        ))}
      </div>

      <form
        className="grid items-end gap-3 rounded-2xl border border-peat-forest/10 bg-white p-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_0.9fr_auto]"
        onSubmit={onApply}
      >
        <Field label="Zona gambut">
          <select
            className={controlClassName}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                zoneId: event.currentTarget.value,
              })
            }
            value={draftFilters.zoneId}
          >
            <option value="">Semua zona</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </Field>
        <Field hint="Tanggal WIB, termasuk hari itu" label="Dari tanggal">
          <input
            className={controlClassName + " font-mono"}
            max={draftFilters.to || undefined}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                from: event.currentTarget.value,
              })
            }
            type="date"
            value={draftFilters.from}
          />
        </Field>
        <Field hint="Tanggal WIB, termasuk hari itu" label="Sampai tanggal">
          <input
            className={controlClassName + " font-mono"}
            min={draftFilters.from || undefined}
            onChange={(event) =>
              onDraftChange({ ...draftFilters, to: event.currentTarget.value })
            }
            type="date"
            value={draftFilters.to}
          />
        </Field>
        <Field label="Data demonstrasi">
          <select
            className={controlClassName}
            onChange={(event) =>
              onDraftChange({
                ...draftFilters,
                isDemoSample: event.currentTarget
                  .value as ReportFilters["isDemoSample"],
              })
            }
            value={draftFilters.isDemoSample}
          >
            <option value="all">Semua data</option>
            <option value="false">Operasional</option>
            <option value="true">Sampel demo</option>
          </select>
        </Field>
        <div className="flex gap-2 md:col-span-2 xl:col-span-1">
          <button
            className="min-h-11 flex-1 rounded-xl border border-peat-forest/15 px-4 text-sm font-semibold text-peat-forest hover:bg-peat-paper disabled:opacity-60"
            disabled={isLoading}
            onClick={onReset}
            type="button"
          >
            Atur ulang
          </button>
          <button
            className="min-h-11 flex-1 rounded-xl bg-peat-forest px-4 text-sm font-semibold text-white hover:bg-peat-green disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            Terapkan
          </button>
        </div>
        {error ? (
          <p
            className="text-sm text-red-800 md:col-span-2 xl:col-span-5"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function StatusTab({
  count,
  isSelected,
  label,
  onSelect,
}: {
  count: number | null;
  isSelected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={
        "flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-left text-xs font-semibold transition-colors sm:px-4 sm:text-sm " +
        (isSelected
          ? "bg-peat-forest text-white"
          : "text-peat-forest hover:bg-peat-paper")
      }
      onClick={onSelect}
      type="button"
    >
      <span>{label}</span>
      <span
        className={
          "rounded-full px-2 py-1 font-mono text-xs " +
          (isSelected
            ? "bg-white/15 text-white"
            : "bg-peat-paper text-peat-forest/75")
        }
      >
        {count === null ? "…" : new Intl.NumberFormat("id-ID").format(count)}
      </span>
    </button>
  );
}

function Field({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <label className="block text-xs font-semibold text-peat-forest">
      <span className="mb-1.5 block">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] font-normal text-peat-forest/60">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
