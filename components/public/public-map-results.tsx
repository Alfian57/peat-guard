import { Flame, MapPinned } from "lucide-react";

import type { PublicMapViewData } from "@/lib/public/client-contracts";

const MAX_VISIBLE_HOTSPOTS = 12;
const MAX_VISIBLE_ZONES = 8;

export function PublicMapResults({ data }: { data: PublicMapViewData | null }) {
  if (data === null) {
    return null;
  }

  const visibleZones = data.zones.slice(0, MAX_VISIBLE_ZONES);
  const visibleHotspots = data.hotspots.slice(0, MAX_VISIBLE_HOTSPOTS);
  const isEmpty = data.zones.length === 0 && data.hotspots.length === 0;

  return (
    <section aria-labelledby="map-results-title">
      <div className="flex items-center justify-between gap-2">
        <h2
          className="font-heading text-xl font-bold text-peat-forest"
          id="map-results-title"
        >
          Hasil area ini
        </h2>
        <span className="text-xs font-medium text-peat-forest/65">
          {data.zones.length} zona · {data.hotspots.length} hotspot
        </span>
      </div>

      {data.truncated.zones || data.truncated.hotspots ? (
        <p className="mt-3 rounded-xl border border-peat-sun/45 bg-peat-sun/15 px-3 py-2 text-xs leading-5 text-peat-forest">
          Hasil dibatasi demi kinerja. Perbesar peta atau gunakan filter untuk
          melihat area yang lebih sempit.
        </p>
      ) : null}

      {isEmpty ? (
        <p className="mt-3 rounded-xl bg-white px-3 py-3 text-sm leading-6 text-peat-forest/70">
          Tidak ada zona disetujui atau hotspot pada rentang filter dan area
          ini.
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {visibleZones.length > 0 ? (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-peat-forest/70 uppercase">
                <MapPinned aria-hidden="true" size={15} />
                Zona disetujui
              </h3>
              <ul className="space-y-2">
                {visibleZones.map((zone) => (
                  <li
                    className="rounded-xl border border-peat-green/15 bg-white px-3 py-2.5"
                    key={zone.id}
                  >
                    <p className="text-sm font-semibold text-peat-forest">
                      {zone.name}
                      {zone.isDemoData ? (
                        <span className="ml-2 rounded-full bg-peat-sun/25 px-2 py-0.5 text-[.65rem] font-semibold">
                          Ilustrasi
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-peat-forest/65">
                      {new Intl.NumberFormat("id-ID", {
                        maximumFractionDigits: 1,
                      }).format(zone.areaHectares)}{" "}
                      ha
                    </p>
                  </li>
                ))}
              </ul>
              {data.zones.length > visibleZones.length ? (
                <p className="mt-2 text-xs text-peat-forest/65">
                  Menampilkan {visibleZones.length} dari {data.zones.length}{" "}
                  zona pada daftar ini.
                </p>
              ) : null}
            </div>
          ) : null}

          {visibleHotspots.length > 0 ? (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-peat-forest/70 uppercase">
                <Flame aria-hidden="true" size={15} />
                Indikasi hotspot satelit
              </h3>
              <ul className="space-y-2">
                {visibleHotspots.map((hotspot) => (
                  <li
                    className="rounded-xl border border-peat-forest/10 bg-white px-3 py-2.5"
                    key={hotspot.id}
                  >
                    <p className="text-sm font-semibold text-peat-forest">
                      {hotspot.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-peat-forest/65">
                      {hotspot.description}
                    </p>
                  </li>
                ))}
              </ul>
              {data.hotspots.length > visibleHotspots.length ? (
                <p className="mt-2 text-xs text-peat-forest/65">
                  Menampilkan {visibleHotspots.length} dari{" "}
                  {data.hotspots.length} hotspot pada daftar ini.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
