import Link from "next/link";
import { Leaf } from "lucide-react";

import { COMMAND_ROUTES } from "@/components/command/routes";

export function CommandBrand({
  compact = false,
  tone = "light",
}: {
  compact?: boolean;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <Link
      aria-label="PEATGUARD, peta komando"
      className={`flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 ${
        isDark
          ? "text-[#f4f0e5] focus-visible:outline-peat-sun"
          : "text-peat-forest focus-visible:outline-peat-green"
      }`}
      href={COMMAND_ROUTES.map}
    >
      <span
        className={`grid shrink-0 place-items-center shadow-sm ${
          isDark
            ? "bg-peat-sun text-[#292b29] shadow-black/20"
            : "bg-peat-forest text-peat-sun shadow-peat-forest/15"
        } ${compact ? "size-9 rounded-xl" : "size-11 rounded-2xl"}`}
      >
        <Leaf aria-hidden="true" size={21} />
      </span>
      <span>
        <span
          className={`block font-heading leading-none font-bold tracking-wide ${
            compact ? "text-lg" : "text-[1.35rem]"
          }`}
        >
          PEATGUARD
        </span>
        {compact ? null : (
          <span
            className={`mt-1 block text-[10px] font-semibold tracking-[0.18em] ${
              isDark ? "text-white/55" : "text-peat-forest/55"
            }`}
          >
            POSKO OPERASIONAL
          </span>
        )}
      </span>
    </Link>
  );
}

export { CommandBrand as Brand };
