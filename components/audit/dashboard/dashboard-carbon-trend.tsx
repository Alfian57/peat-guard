import { ChartNoAxesCombined } from "lucide-react";
import type { MrvDashboard } from "@/lib/server/mrv/contracts";
import { formatCarbon } from "../audit-formatters";

export function DashboardCarbonTrend({
  trend,
}: {
  trend: MrvDashboard["carbonTrend"];
}) {
  const months = trend.status === "available" ? trend.months : [];
  const maximum = Math.max(1, ...months.map((month) => month.carbonTons ?? 0));

  return (
    <section
      aria-labelledby="dashboard-trend-title"
      className="rounded-2xl border border-border bg-white p-5 shadow-xs"
    >
      <h2
        id="dashboard-trend-title"
        className="flex items-center gap-2 font-heading text-2xl font-bold text-peat-forest"
      >
        <ChartNoAxesCombined aria-hidden="true" size={21} />
        Tren estimasi emisi dicegah
      </h2>
      {trend.status === "unavailable" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Perubahan bulanan belum dapat dihitung.
        </p>
      ) : (
        <>
          <p className="my-3 text-sm text-muted-foreground">
            Estimasi simulasi berdasarkan snapshot zona pada akhir bulan di WIB.
          </p>
          <ul className="space-y-2">
            {months.map(({ month, carbonTons, partial }) => (
              <li
                key={month}
                className="grid grid-cols-[max-content_1fr] items-center gap-3 text-sm sm:grid-cols-[max-content_1fr_12rem]"
              >
                <span>
                  {new Intl.DateTimeFormat("id-ID", {
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(month + "-01T00:00:00Z"))}
                  {partial ? " *" : ""}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden h-2 rounded-full bg-peat-paper sm:block"
                >
                  {carbonTons !== null ? (
                    <span
                      style={{ width: `${(100 * carbonTons) / maximum}%` }}
                      className="block h-full rounded-full bg-peat-green"
                    />
                  ) : null}
                </span>
                <span>
                  {carbonTons === null
                    ? "Riwayat belum tersedia"
                    : formatCarbon(carbonTons)}
                </span>
              </li>
            ))}
          </ul>
          {months.some((month) => month.partial) ? (
            <p className="mt-3 text-xs text-muted-foreground">
              * Periode parsial
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
