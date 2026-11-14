import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { APP_ROUTES } from "@/lib/routes";

export function AuditAccessDenied({ requiredRole }: { requiredRole: string }) {
  return (
    <main
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6"
      id="audit-content"
    >
      <section
        aria-labelledby="audit-access-denied-title"
        className="rounded-3xl border border-warning/20 bg-white p-7 shadow-xs sm:p-10"
      >
        <AlertCircle aria-hidden="true" className="text-warning" size={28} />
        <h1
          className="mt-4 font-heading text-3xl font-bold text-peat-forest"
          id="audit-access-denied-title"
        >
          Halaman ini memerlukan akses {requiredRole}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sesi Anda tidak memiliki peran yang diperlukan untuk melihat data ini.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-peat-forest px-4 font-semibold text-white hover:bg-peat-green"
          href={APP_ROUTES.home}
        >
          Kembali ke beranda
        </Link>
      </section>
    </main>
  );
}
