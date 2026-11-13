import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { APP_ROUTES } from "@/lib/routes";

export function AuditBrand({
  compact = false,
  tone = "light",
}: {
  compact?: boolean;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <Link
      aria-label="PEATGUARD, verifikasi dan audit karbon"
      className={`flex min-h-11 w-fit shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 ${
        isDark
          ? "text-[#f4f0e5] focus-visible:outline-peat-sun"
          : "text-peat-forest focus-visible:outline-peat-green"
      }`}
      href={APP_ROUTES.audit.dashboard}
    >
      <BrandLogo decorative height={compact ? 32 : 40} tone={tone} />
    </Link>
  );
}
