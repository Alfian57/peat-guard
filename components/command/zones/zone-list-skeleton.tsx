import { Skeleton } from "@/components/ui/skeleton";

export function ZoneListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat daftar zona"
      className="space-y-5"
      role="status"
    >
      {/* Stats Card Skeleton */}
      <div className="rounded-2xl border border-peat-forest/10 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-4 divide-y divide-peat-forest/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {Array.from({ length: 3 }, (_, i) => (
            <div className="space-y-2 pt-3 sm:px-4 sm:pt-0" key={i}>
              <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/10" />
              <Skeleton className="h-8 w-24 rounded-lg bg-peat-forest/15" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-peat-forest/70">
              <tr>
                <th className="px-4 py-3.5" scope="col">
                  Nama Zona & Desa
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Status Verifikasi
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Luas Terhitung
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Kedalaman
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Faktor Karbon
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Sumber Air
                </th>
                <th className="px-4 py-3.5 text-right" scope="col">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peat-forest/10 text-sm">
              {Array.from({ length: 5 }, (_, index) => (
                <tr key={index}>
                  {/* Name & Village */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-4 w-36 rounded-md bg-peat-forest/15" />
                    <Skeleton className="mt-1 h-3 w-28 rounded-md bg-peat-forest/10" />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-6 w-24 rounded-full bg-peat-forest/10" />
                  </td>

                  {/* Area */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-4 w-20 rounded-md bg-peat-forest/10 font-mono" />
                  </td>

                  {/* Peat depth */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-4 w-16 rounded-md bg-peat-forest/10 font-mono" />
                  </td>

                  {/* Carbon factor */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-4 w-12 rounded-md bg-peat-forest/10 font-mono" />
                  </td>

                  {/* Water points */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-4 w-16 rounded-md bg-peat-forest/10 font-mono" />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right align-middle">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Skeleton className="size-9 rounded-full bg-peat-forest/10" />
                      <Skeleton className="size-9 rounded-full bg-peat-forest/10" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
