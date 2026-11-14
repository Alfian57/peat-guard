import { Skeleton } from "@/components/ui/skeleton";

export function WaterPointGridSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat titik sumber air"
      className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs"
      role="status"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-peat-forest/70">
            <tr>
              <th className="px-4 py-3.5" scope="col">
                Nama titik air
              </th>
              <th className="px-4 py-3.5" scope="col">
                Jenis titik
              </th>
              <th className="px-4 py-3.5" scope="col">
                Zona terkait
              </th>
              <th className="px-4 py-3.5" scope="col">
                Koordinat
              </th>
              <th className="px-4 py-3.5 text-right" scope="col">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-peat-forest/10 text-sm">
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                {/* Name */}
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-8 rounded-lg bg-sky-100" />
                    <Skeleton className="h-4 w-32 rounded-md bg-peat-forest/15" />
                  </div>
                </td>

                {/* Type */}
                <td className="px-4 py-3.5 align-middle">
                  <Skeleton className="h-6 w-20 rounded-full bg-peat-forest/10" />
                </td>

                {/* Zone */}
                <td className="px-4 py-3.5 align-middle">
                  <Skeleton className="h-4 w-28 rounded-md bg-peat-forest/15" />
                </td>

                {/* Coordinates */}
                <td className="px-4 py-3.5 align-middle">
                  <Skeleton className="h-4 w-36 rounded-md bg-peat-forest/10 font-mono" />
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
  );
}
