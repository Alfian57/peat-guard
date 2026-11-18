import {
  AuditAccessDenied,
  AuditDataError,
} from "@/components/audit/audit-states";
import { ZoneReviewRow } from "@/components/audit/zones/zone-review-row";
import { WorkspacePageHeading } from "@/components/workspace/workspace-page-heading";
import { getAuditPageSession } from "@/lib/server/audit-page-access";
import { listPendingZoneReviews } from "@/lib/server/zones/data";

import { CarbonParameterManager } from "@/components/audit/zones/carbon-parameter-manager";
import { listCarbonParameters } from "@/lib/server/mrv/parameters";
import { listCommandZones } from "@/lib/server/zones/data";

export async function AuditZonesData() {
  const session = await getAuditPageSession(["VERIFIKATOR"]);
  if (!session) return <AuditAccessDenied requiredRole="Verifikator" />;

  const result = await Promise.all([
    listPendingZoneReviews(),
    listCarbonParameters(),
    listCommandZones(),
  ]).catch(() => null);
  if (!result) return <AuditDataError title="Verifikasi zona" />;

  const [reviews, parameters, zones] = result;
  const conflicts = zones.filter((zone) => zone.overlapsApprovedZone);

  return (
    <div>
      <WorkspacePageHeading
        title="Verifikasi zona"
        description="Tinjau batas dan data zona gambut sebelum menyetujui penggunaannya."
      />
      <CarbonParameterManager parameters={parameters} />
      {conflicts.length ? (
        <section className="mb-5 rounded-xl border border-warning/30 bg-white p-4">
          <h2 className="font-semibold">
            Zona disetujui dengan batas tumpang tindih
          </h2>
          <p className="mt-1 text-sm">
            Posko perlu merevisi batas. Zona ini dikeluarkan dari total dampak.
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {conflicts.map((zone) => (
              <li key={zone.id}>{zone.name}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {reviews.length ? (
        <section
          aria-label="Zona menunggu verifikasi"
          className="overflow-hidden rounded-2xl border border-peat-forest/10 bg-white shadow-xs"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <caption className="sr-only">
                Daftar zona gambut yang menunggu verifikasi
              </caption>
              <thead className="border-b border-peat-forest/10 bg-[#f6f7ef] text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left" scope="col">
                    Zona
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Desa
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Luas zona
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Kedalaman gambut
                  </th>
                  <th className="px-4 py-3 text-left" scope="col">
                    Status verifikasi
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {reviews.map(({ zone, revision }) => (
                  <ZoneReviewRow
                    key={`${zone.id}:${revision}`}
                    revision={revision}
                    zone={zone}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p className="rounded-2xl border border-border bg-white p-6 text-sm text-muted-foreground shadow-xs">
          Tidak ada zona yang menunggu verifikasi.
        </p>
      )}
    </div>
  );
}
