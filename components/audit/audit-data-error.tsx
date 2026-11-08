import { AlertCircle } from "lucide-react";

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
