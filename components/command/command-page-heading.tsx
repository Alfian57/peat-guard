import type { ReactNode } from "react";

export function CommandPageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold tracking-[0.16em] text-peat-green uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-heading text-4xl leading-none font-bold text-peat-forest sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-peat-forest/70 sm:text-base">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
