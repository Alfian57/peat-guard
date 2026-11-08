import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  featured = false,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  featured?: boolean;
}) {
  return (
    <article
      className={`audit-print-card rounded-2xl border p-5 shadow-sm sm:p-6 ${featured ? "border-peat-forest bg-peat-forest text-white" : "border-border bg-white text-peat-forest"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className={`text-sm font-semibold ${featured ? "text-white/80" : "text-muted-foreground"}`}
        >
          {label}
        </p>
        <Icon
          aria-hidden="true"
          className={featured ? "text-white/75" : "text-peat-green"}
          size={19}
        />
      </div>
      <p className="mt-5 font-heading text-4xl leading-none font-bold tracking-wide sm:text-5xl">
        {value}
      </p>
      <p
        className={`mt-3 text-sm ${featured ? "text-white/75" : "text-muted-foreground"}`}
      >
        {description}
      </p>
    </article>
  );
}
