import { BrandLogo } from "@/components/brand/brand-logo";

export function AuditHeaderFallback() {
  return (
    <header
      aria-label="Memuat navigasi"
      className="min-h-[4.5rem] border-b border-peat-forest/10 bg-peat-paper/95"
    >
      <div className="mx-auto flex min-h-[4.5rem] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo height={40} />
        <span className="h-8 w-40 animate-pulse rounded-lg bg-peat-forest/10" />
      </div>
    </header>
  );
}
