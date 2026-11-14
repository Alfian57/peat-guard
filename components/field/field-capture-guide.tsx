import { Camera, MapPin, NotebookPen } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Ambil foto dari tempat aman",
    description:
      "Perlihatkan kondisi temuan dengan jelas dan hindari mendekati api atau asap.",
  },
  {
    icon: MapPin,
    title: "Periksa titik lokasi",
    description: "Gunakan GPS atau masukkan koordinat temuan secara manual.",
  },
  {
    icon: NotebookPen,
    title: "Tambahkan konteks",
    description:
      "Pilih kategori temuan dan catat kondisi sekitar yang perlu diketahui posko.",
  },
];

export function FieldCaptureGuide() {
  return (
    <section
      aria-labelledby="field-guide-title"
      className="min-w-0 rounded-2xl border border-peat-forest/10 bg-white p-4 shadow-xs"
    >
      <h2
        id="field-guide-title"
        className="font-heading text-2xl font-bold text-peat-forest"
      >
        Panduan mencatat temuan
      </h2>
      <ul className="mt-3 grid gap-2.5 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, description }) => (
          <li key={title} className="rounded-xl bg-peat-paper p-3">
            <div className="flex items-center gap-2">
              <Icon
                aria-hidden="true"
                className="shrink-0 text-peat-green"
                size={17}
              />
              <h3 className="text-sm font-semibold text-peat-forest">
                {title}
              </h3>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
