import type { HandlingStatus } from "../lib/generated/prisma/enums";
import type { EvidenceReviewDecision } from "../lib/server/mrv/contracts";

export const demoZones = [
  {
    slug: "demo-khg-sungai-01",
    name: "Zona Demo Sungai 01",
    village: "Desa Demo Gambut",
    longitude: 113.9,
    latitude: -2,
    width: 0.008986075743241726,
    height: 0.009046116338408152,
    depth: 1.5,
    approved: true,
  },
  {
    slug: "demo-khg-sungai-02",
    name: "Zona Demo Sungai 02",
    village: "Desa Demo Gambut",
    longitude: 113.9,
    latitude: -2.012,
    width: 0.008989423114060074,
    height: 0.005425687447461649,
    depth: 1.5,
    approved: true,
  },
  {
    slug: "demo-khg-sungai-03",
    name: "Zona Demo Sungai 03",
    village: "Desa Demo Gambut",
    longitude: 113.9,
    latitude: -2.02,
    width: 0.008981163225556166,
    height: 0.0036204689172063833,
    depth: 1.5,
    approved: true,
  },
  {
    slug: "demo-khg-rawa-meranti",
    name: "Zona Demo Rawa Meranti",
    village: "Desa Demo Meranti",
    longitude: 113.883,
    latitude: -2.034,
    width: 0.012,
    height: 0.008,
    depth: 2.2,
    approved: true,
  },
  {
    slug: "demo-khg-kanal-purun",
    name: "Zona Demo Kanal Purun",
    village: "Desa Demo Purun",
    longitude: 113.919,
    latitude: -2.044,
    width: 0.013,
    height: 0.01,
    depth: 2.8,
    approved: true,
  },
  {
    slug: "demo-khg-sempadan-purun",
    name: "Zona Demo Sempadan Purun",
    village: "Desa Demo Purun",
    longitude: 113.936,
    latitude: -2.051,
    width: 0.009,
    height: 0.008,
    depth: 1.8,
    approved: false,
  },
].map((zone, index) => ({
  ...zone,
  id: `61000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
}));

export const demoWaterPoints = [
  {
    zone: 0,
    name: "Sekat Kanal Demo 01",
    type: "SEKAT_KANAL",
    latitude: -1.999,
    longitude: 113.901,
  },
  {
    zone: 1,
    name: "Embung Demo 02",
    type: "EMBUNG",
    latitude: -2.012,
    longitude: 113.903,
  },
  {
    zone: 2,
    name: "Sekat Kanal Demo 03",
    type: "SEKAT_KANAL",
    latitude: -2.02,
    longitude: 113.899,
  },
  {
    zone: 3,
    name: "Sumber Air Demo Meranti",
    type: "SUMBER_AIR",
    latitude: -2.035,
    longitude: 113.884,
  },
  {
    zone: 4,
    name: "Embung Demo Purun",
    type: "EMBUNG",
    latitude: -2.044,
    longitude: 113.917,
  },
  {
    zone: 4,
    name: "Sekat Kanal Demo Purun Timur",
    type: "SEKAT_KANAL",
    latitude: -2.046,
    longitude: 113.922,
  },
] as const;

export const demoHotspots = [
  {
    latitude: -2.001,
    longitude: 113.904,
    brightnessKelvin: 315.4,
    confidence: "nominal",
    hoursAgo: 1,
  },
  {
    latitude: -2.014,
    longitude: 113.897,
    brightnessKelvin: 302.8,
    confidence: "low",
    hoursAgo: 18,
  },
  {
    latitude: -2.0014,
    longitude: 113.9017,
    brightnessKelvin: 332.1,
    confidence: "high",
    hoursAgo: 2,
  },
  {
    latitude: -2.0329,
    longitude: 113.8824,
    brightnessKelvin: 322.6,
    confidence: "nominal",
    hoursAgo: 8,
  },
  {
    latitude: -2.0447,
    longitude: 113.9206,
    brightnessKelvin: 326.8,
    confidence: "high",
    hoursAgo: 20,
  },
  {
    latitude: -2.021,
    longitude: 113.899,
    brightnessKelvin: 307.6,
    confidence: "low",
    hoursAgo: 31,
  },
  {
    latitude: -2.036,
    longitude: 113.8845,
    brightnessKelvin: 312.1,
    confidence: "nominal",
    hoursAgo: 57,
  },
  {
    latitude: -2.0473,
    longitude: 113.9211,
    brightnessKelvin: 317.2,
    confidence: "nominal",
    hoursAgo: 92,
  },
  {
    latitude: -2.0118,
    longitude: 113.902,
    brightnessKelvin: 305.5,
    confidence: "low",
    hoursAgo: 133,
  },
] as const;

type ReportFixture = {
  number: number;
  hoursAgo: number;
  latitude: number;
  longitude: number;
  scenario: "smoke" | "canal" | "forest";
  status: HandlingStatus;
  notes: string;
  aiState?: "SKIPPED" | "FAILED";
  critical?: boolean;
  review?: EvidenceReviewDecision;
  noPhoto?: boolean;
  accuracy?: number | null;
};

export const demoReports: readonly ReportFixture[] = [
  {
    number: 1,
    hoursAgo: 0.2,
    latitude: -2.0013,
    longitude: 113.9015,
    scenario: "smoke",
    critical: true,
    status: "MENUNGGU_TINDAKAN",
    notes:
      "Asap pekat muncul dari lahan di sisi timur kanal. Perlu pemeriksaan posko.",
  },
  {
    number: 2,
    hoursAgo: 0.4,
    latitude: -2.0444,
    longitude: 113.9194,
    scenario: "canal",
    status: "MENUNGGU_TINDAKAN",
    notes: "Muka air di bawah ambang sekat Kanal Purun. Mohon cek kebocoran.",
  },
  {
    number: 3,
    hoursAgo: 0.7,
    latitude: -2.0333,
    longitude: 113.8832,
    scenario: "smoke",
    status: "DALAM_PENANGANAN",
    notes:
      "Asap tipis terlihat dekat jalur Rawa Meranti. Posko menugaskan patroli pengecekan.",
    review: "NEEDS_FOLLOW_UP",
  },
  {
    number: 4,
    hoursAgo: 1.5,
    latitude: -2.0196,
    longitude: 113.8996,
    scenario: "forest",
    status: "SELESAI",
    notes: "Patroli ulang mendapati vegetasi lembap dan kondisi terkendali.",
    review: "ACCEPTED",
  },
  {
    number: 5,
    hoursAgo: 4,
    latitude: -2.0116,
    longitude: 113.9025,
    scenario: "forest",
    status: "MENUNGGU_TINDAKAN",
    notes: "Catatan pemeriksaan jalur embung menjelang pergantian regu.",
    aiState: "SKIPPED",
  },
  {
    number: 6,
    hoursAgo: 8,
    latitude: -2.04,
    longitude: 113.908,
    scenario: "smoke",
    status: "MENUNGGU_TINDAKAN",
    notes:
      "Foto dokumentasi belum tersedia pada laporan lama. Lokasi perlu dicek ulang.",
    aiState: "SKIPPED",
    noPhoto: true,
    accuracy: null,
    review: "REJECTED",
  },
  {
    number: 7,
    hoursAgo: 19,
    latitude: -2.0451,
    longitude: 113.9209,
    scenario: "smoke",
    critical: true,
    status: "DALAM_PENANGANAN",
    notes:
      "Kepulan asap bertahan di sisi selatan kanal. Jalur masuk telah diperiksa.",
  },
  {
    number: 8,
    hoursAgo: 28,
    latitude: -2.0129,
    longitude: 113.9008,
    scenario: "canal",
    status: "DALAM_PENANGANAN",
    notes:
      "Papan sekat renggang. Petugas menjadwalkan pengecekan bersama penjaga embung.",
    aiState: "FAILED",
  },
  {
    number: 9,
    hoursAgo: 49,
    latitude: -2.0351,
    longitude: 113.8842,
    scenario: "forest",
    status: "SELESAI",
    notes:
      "Sumber air bisa dijangkau dan genangan di sekitarnya masih terlihat.",
  },
  {
    number: 10,
    hoursAgo: 74,
    latitude: -2.0003,
    longitude: 113.8983,
    scenario: "canal",
    status: "SELESAI",
    notes:
      "Papan yang longgar sudah diperbaiki dan aliran air kembali tertahan.",
  },
  {
    number: 11,
    hoursAgo: 100,
    latitude: -2.0207,
    longitude: 113.9027,
    scenario: "smoke",
    status: "SELESAI",
    notes:
      "Posko menutup pemeriksaan setelah kunjungan ulang tidak menemukan asap.",
  },
  {
    number: 12,
    hoursAgo: 127,
    latitude: -2.0431,
    longitude: 113.9169,
    scenario: "forest",
    status: "SELESAI",
    notes:
      "Patroli rutin selesai. Tutupan vegetasi di tepi embung terpantau basah.",
  },
  {
    number: 13,
    hoursAgo: 150,
    latitude: -2.0347,
    longitude: 113.8806,
    scenario: "canal",
    status: "DALAM_PENANGANAN",
    notes:
      "Permukaan air surut pada segmen barat. Jadwalkan pengukuran lanjutan.",
  },
  {
    number: 14,
    hoursAgo: 210,
    latitude: -2.0133,
    longitude: 113.8975,
    scenario: "forest",
    status: "SELESAI",
    notes:
      "Titik pantau embung dicatat untuk dibandingkan pada patroli berikutnya.",
    aiState: "SKIPPED",
  },
  {
    number: 15,
    hoursAgo: 335,
    latitude: -2.0004,
    longitude: 113.9031,
    scenario: "smoke",
    status: "SELESAI",
    notes:
      "Posko sudah memeriksa lokasi dan tidak lagi melihat kepulan pada pemantauan ulang.",
  },
  {
    number: 16,
    hoursAgo: 510,
    latitude: -2.0462,
    longitude: 113.9221,
    scenario: "canal",
    status: "SELESAI",
    notes:
      "Pemeriksaan sekat timur ditutup setelah papan penahan difungsikan kembali.",
  },
  {
    number: 17,
    hoursAgo: 755,
    latitude: -2.0358,
    longitude: 113.8852,
    scenario: "forest",
    status: "SELESAI",
    notes:
      "Dokumentasi awal jalur Rawa Meranti sebagai pembanding kondisi musim kering.",
  },
  {
    number: 18,
    hoursAgo: 945,
    latitude: -2.0191,
    longitude: 113.9009,
    scenario: "canal",
    status: "SELESAI",
    notes: "Kondisi sekat didokumentasikan sebelum pemeriksaan lanjutan.",
    aiState: "FAILED",
  },
];

export const evidenceScenarios = {
  smoke: {
    assets: ["smoke-peat-01.webp", "smoke-peat-02.webp"],
    tags: ["Asap", "Vegetasi"],
    category: "ASAP_GAMBUT",
    urgency: "WASPADA",
    confidence: 0.88,
    summary:
      "Simulasi triase: asap dekat permukaan gambut dan vegetasi kering.",
    indicators: [
      "Kepulan putih dari permukaan tanah",
      "Vegetasi kering di sekitar kepulan",
    ],
    falsePositive:
      "Kabut dan uap tetap perlu dibedakan melalui pemeriksaan di lokasi.",
    recommendations: [
      "Konfirmasi sumber asap dengan petugas posko",
      "Dokumentasikan hasil pemeriksaan dari posisi aman",
    ],
    responseNote: "Tim patroli ditugaskan untuk memeriksa sumber asap.",
    closureNote: "Pemantauan ulang selesai dan asap sudah tidak terlihat.",
  },
  canal: {
    assets: ["canal-check-01.webp", "canal-check-02.webp"],
    tags: ["Kanal"],
    category: "SEKAT_KANAL_KERING",
    urgency: "WASPADA",
    confidence: 0.83,
    summary: "Simulasi triase: tampak dasar kanal dangkal di dekat sekat kayu.",
    indicators: [
      "Muka air berada di bawah papan sekat",
      "Sebagian dasar kanal terbuka",
    ],
    falsePositive:
      "Kedalaman dan kondisi sekat perlu dicek dengan pengukuran langsung.",
    recommendations: [
      "Periksa muka air pada kedua sisi sekat",
      "Catat kondisi papan dan kemungkinan kebocoran",
    ],
    responseNote: "Petugas dijadwalkan memeriksa sekat dan muka air.",
    closureNote: "Perbaikan sekat diperiksa kembali dan tindak lanjut ditutup.",
  },
  forest: {
    assets: ["wetland-vegetation-01.webp", "wetland-trail-02.webp"],
    tags: ["Vegetasi"],
    category: "AMAN_TERKENDALI",
    urgency: "RENDAH",
    confidence: 0.94,
    summary:
      "Simulasi triase: vegetasi lembap dengan genangan terlihat di permukaan.",
    indicators: [
      "Genangan air di sekitar akar",
      "Tidak terlihat kepulan asap di dalam foto",
    ],
    falsePositive:
      "Foto hanya mewakili area yang terlihat pada saat pengambilan.",
    recommendations: [
      "Lanjutkan patroli rutin",
      "Bandingkan kondisi vegetasi pada kunjungan berikutnya",
    ],
    responseNote:
      "Posko memeriksa dokumentasi patroli dan jadwal pemeriksaan ulang.",
    closureNote:
      "Pemeriksaan selesai, pemantauan dilanjutkan melalui patroli rutin.",
  },
} as const;
