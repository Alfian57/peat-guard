import { Skeleton } from "@/components/ui/skeleton";

export function ReportQueueSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat antrean laporan"
      className="space-y-3"
      role="status"
    >
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-4 w-40 rounded-md bg-peat-forest/10" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] border-collapse text-left">
            <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-peat-forest/70">
              <tr>
                <th className="px-4 py-3.5" scope="col">
                  ID laporan
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Jenis data
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Zona gambut & lokasi
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Triase AI
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Urgensi AI
                </th>
                <th className="px-4 py-3.5" scope="col">
                  Status penanganan
                </th>
                <th className="px-4 py-3.5 text-right" scope="col">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peat-forest/10 text-sm">
              {Array.from({ length: 5 }, (_, index) => (
                <tr key={index}>
                  {/* Report ID */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-4 w-24 rounded-md bg-peat-forest/15 font-mono" />
                    <Skeleton className="mt-1.5 h-3 w-28 rounded-md bg-peat-forest/10" />
                  </td>

                  {/* Data type */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-5 w-20 rounded-full bg-peat-forest/10" />
                  </td>

                  {/* Zone & Location */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-4 w-32 rounded-md bg-peat-forest/15" />
                    <Skeleton className="mt-1 h-3 w-40 rounded-md bg-peat-forest/10 font-mono" />
                  </td>

                  {/* AI Category */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-4 w-24 rounded-md bg-peat-forest/15" />
                    <Skeleton className="mt-1 h-3 w-20 rounded-md bg-peat-forest/10" />
                  </td>

                  {/* Urgency */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-6 w-20 rounded-full bg-peat-forest/10" />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 align-middle">
                    <Skeleton className="h-6 w-24 rounded-full bg-peat-forest/10" />
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right align-middle">
                    <Skeleton className="inline-block h-9 w-24 rounded-full bg-peat-forest/10" />
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
