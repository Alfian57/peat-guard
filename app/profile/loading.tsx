import { Skeleton } from "@/components/ui/skeleton";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";

const panelClassName =
  "rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs sm:p-6";

export default function ProfileLoading() {
  return (
    <div className="min-h-dvh bg-[#fbfaf6] lg:flex motion-reduce:[&_[data-slot=skeleton]]:animate-none">
      <div
        aria-hidden="true"
        className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar lg:block"
      >
        <div className="flex h-18 items-center border-b border-sidebar-border px-6">
          <Skeleton className="h-10 w-32 rounded-lg bg-peat-forest/10" />
        </div>
        <div className="space-y-2.5 px-6 pt-6">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex h-13 items-center gap-3 px-4">
              <Skeleton className="size-4 bg-peat-forest/10" />
              <Skeleton className="h-4 w-28 bg-peat-forest/10" />
            </div>
          ))}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div aria-hidden="true" className="border-b border-peat-forest/10">
          <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-7 lg:h-18 xl:px-9">
            <Skeleton className="h-8 w-28 bg-peat-forest/10 lg:h-10 lg:w-72" />
            <div className="flex items-center gap-3">
              <Skeleton className="hidden h-8 w-36 rounded-full bg-peat-forest/10 lg:block" />
              <Skeleton className="size-9 rounded-full bg-peat-forest/10" />
            </div>
          </div>
          <div className="flex h-11 items-center gap-2 border-t border-peat-forest/10 bg-white px-4 sm:px-7 lg:hidden">
            <Skeleton className="size-3.5 bg-peat-forest/10" />
            <Skeleton className="h-3 w-32 bg-peat-forest/10" />
          </div>
        </div>
        <main className="mx-auto w-full max-w-[1600px] p-4 pb-24 sm:p-7 sm:pb-24 lg:pb-7 xl:p-9">
          <WorkspacePageHeading
            title="Profil Anda"
            description="Kelola informasi akun, foto profil, dan keamanan akses ruang kerja."
          />
          <div
            className="grid max-w-4xl gap-5"
            role="status"
            aria-label="Memuat profil"
          >
            <div aria-hidden="true" className={panelClassName}>
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl bg-peat-forest/10" />
                <Skeleton className="h-6 w-32 bg-peat-forest/15" />
              </div>
              <Skeleton className="mt-3 mb-5 h-6 w-full max-w-80 bg-peat-forest/10" />
              <div className="flex flex-col gap-4 border-b border-peat-forest/10 pb-5 sm:flex-row sm:items-center">
                <Skeleton className="size-20 shrink-0 rounded-full bg-peat-forest/10 sm:size-24" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20 bg-peat-forest/10" />
                  <Skeleton className="h-3 w-52 max-w-full bg-peat-forest/10" />
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {["Nama", "Desa", "Email"].map((field) => (
                  <div key={field}>
                    <Skeleton className="h-5 w-24 bg-peat-forest/10" />
                    <Skeleton className="mt-2 h-11 rounded-xl bg-peat-forest/10" />
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-peat-forest/10 pt-4">
                <Skeleton className="ml-auto h-9 w-32 rounded-xl bg-peat-forest/15" />
              </div>
            </div>
            <div aria-hidden="true" className={panelClassName}>
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl bg-peat-forest/10" />
                <Skeleton className="h-6 w-28 bg-peat-forest/15" />
              </div>
              <Skeleton className="mt-3 mb-5 h-6 w-full max-w-60 bg-peat-forest/10" />
              <div className="grid gap-4 sm:grid-cols-2">
                {["Saat ini", "Baru", "Konfirmasi"].map((field, index) => (
                  <div
                    key={field}
                    className={index === 0 ? "sm:col-span-2" : undefined}
                  >
                    <Skeleton className="h-5 w-28 bg-peat-forest/10" />
                    <Skeleton className="mt-2 h-11 rounded-xl bg-peat-forest/10" />
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-peat-forest/10 pt-4">
                <Skeleton className="ml-auto h-9 w-32 rounded-xl bg-peat-forest/15" />
              </div>
            </div>
          </div>
        </main>
        <div
          aria-hidden="true"
          className="fixed inset-x-0 bottom-0 grid grid-cols-3 gap-2 border-t border-peat-forest/10 bg-white px-4 py-2 lg:hidden"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex h-14 flex-col items-center justify-center gap-1.5"
            >
              <Skeleton className="size-5 bg-peat-forest/10" />
              <Skeleton className="h-2.5 w-12 bg-peat-forest/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
