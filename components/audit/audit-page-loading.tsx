import { LoaderCircle } from "lucide-react";

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
