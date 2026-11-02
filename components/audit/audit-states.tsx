import Link from "next/link";
import { AlertCircle, LoaderCircle } from "lucide-react";

export function AuditPageLoading({ title }: { title: string }) {
  return (
    <main
      aria-busy="true"
      aria-label={`Memuat ${title}`}
      className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8"
      id="audit-content"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-6 text-muted-foreground shadow-sm">
        <LoaderCircle aria-hidden="true" className="animate-spin" size={20} />
        Memuat {title.toLowerCase()}…
      </div>
    </main>
  );
}

export function AuditAccessDenied({ requiredRole }: { requiredRole: string }) {
  return (
    <main
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6"
      id="audit-content"
    >
      <section
        aria-labelledby="audit-access-denied-title"
        className="rounded-3xl border border-warning/20 bg-white p-7 shadow-sm sm:p-10"
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
          href="/"
        >
          Kembali ke beranda
        </Link>
      </section>
    </main>
  );
}

export function AuditFilterError({ message }: { message: string }) {
  return (
    <p
      aria-live="polite"
      className="rounded-xl border border-critical/20 bg-critical/5 px-4 py-3 text-sm font-medium text-critical"
      role="alert"
    >
      {message}
    </p>
  );
}

export function AuditDataError({ title }: { title: string }) {
  return (
    <main
      className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8"
      id="audit-content"
    >
      <section
        aria-labelledby="audit-data-error-title"
        className="rounded-2xl border border-critical/20 bg-white p-6 shadow-sm"
      >
        <AlertCircle aria-hidden="true" className="text-critical" size={22} />
        <h1
          className="mt-3 font-heading text-2xl font-bold text-peat-forest"
          id="audit-data-error-title"
        >
          {title} belum dapat dimuat
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Layanan data belum dapat dihubungi. Coba muat ulang halaman beberapa
          saat lagi.
        </p>
      </section>
    </main>
  );
}
