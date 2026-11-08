import Link from "next/link";
import { Leaf } from "lucide-react";

import { COMMAND_ROUTES } from "@/components/command/routes";

export function CommandBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      aria-label="PEATGUARD, peta komando"
      className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-peat-sun"
      href={COMMAND_ROUTES.map}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-peat-sun text-peat-forest">
        <Leaf aria-hidden="true" size={21} />
      </span>
      <span>
        <span className="block font-heading text-2xl font-bold tracking-wide">
          PEATGUARD
        </span>
        {compact ? null : (
          <span className="block text-xs text-white/65">POSKO OPERASIONAL</span>
        )}
      </span>
    </Link>
  );
}

export { CommandBrand as Brand };
