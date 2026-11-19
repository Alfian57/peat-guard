import type { LucideIcon } from "lucide-react";
import { formatDateTime } from "../audit-formatters";

export function KpiCard({
  asOf,
  label,
  value,
  description,
  icon: Icon,
}: {
  asOf?: string;
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <article className="audit-print-card flex min-w-0 flex-col rounded-2xl border border-peat-forest/10 bg-white p-5 text-peat-forest shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs leading-5 font-medium text-muted-foreground">
          {label}
        </p>
        <Icon
          aria-hidden="true"
          className="shrink-0 text-peat-forest"
          size={19}
        />
      </div>
      <p className="mt-3 font-heading text-3xl leading-tight font-bold wrap-anywhere text-peat-forest tabular-nums sm:text-4xl">
        {value}
      </p>
      {asOf ? (
        <p className="mt-1 text-xs font-medium text-peat-forest">
          Per <time dateTime={asOf}>{formatDateTime(asOf)} WIB</time>
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}
