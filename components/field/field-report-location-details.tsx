export function FieldReportLocationDetails({
  latitude,
  longitude,
  accuracyMeters,
  capturedAt,
  nearestWaterDistanceM,
}: {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
  nearestWaterDistanceM?: number | null;
}) {
  return (
    <section
      className="min-w-0 rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs"
      aria-labelledby="field-location-heading"
    >
      <h2
        id="field-location-heading"
        className="font-heading text-2xl font-bold text-peat-forest"
      >
        Lokasi dan waktu
      </h2>
      <dl className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Koordinat</dt>
          <dd className="mt-1 font-mono text-sm wrap-anywhere text-peat-forest">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Akurasi GPS</dt>
          <dd className="mt-1 text-sm text-peat-forest">
            {accuracyMeters === null
              ? "Tidak tersedia"
              : "±" + Math.round(accuracyMeters) + " m"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Waktu direkam</dt>
          <dd className="mt-1 text-sm text-peat-forest">
            <time dateTime={capturedAt}>
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
                timeZone: "Asia/Jakarta",
              }).format(new Date(capturedAt))}
            </time>
          </dd>
        </div>
        {nearestWaterDistanceM !== undefined ? (
          <div>
            <dt className="text-xs text-muted-foreground">
              Sumber air terdekat
            </dt>
            <dd className="mt-1 text-sm text-peat-forest">
              {nearestWaterDistanceM === null
                ? "Tidak tersedia"
                : Math.round(nearestWaterDistanceM) + " m"}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
