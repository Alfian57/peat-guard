import type { ReactNode } from "react";

export function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-peat-forest/75">{label}</p>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-peat-forest/8 text-peat-green">
          {icon}
        </span>
      </div>
      <p className="mt-4 font-heading text-4xl leading-none font-bold text-peat-forest sm:text-[2.75rem]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-peat-forest/65">{detail}</p>
    </article>
  );
}
