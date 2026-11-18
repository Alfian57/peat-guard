import { APP_ROUTES } from "@/lib/routes";
import type { AppRole } from "@/lib/roles";
import type { GlobalSearchResult } from "@/lib/server/search/contracts";

export type SearchMenuItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  roles: AppRole[];
  keywords: string[];
};

export const MENU_CATALOG: SearchMenuItem[] = [
  // Semua Role
  {
    id: "menu-profile",
    title: "Profil",
    description: "Kelola informasi akun, email, kata sandi, dan foto avatar",
    href: APP_ROUTES.profile,
    roles: ["RELAWAN", "POSKO", "VERIFIKATOR"],
    keywords: [
      "profil",
      "profile",
      "akun",
      "user",
      "pengaturan",
      "settings",
      "password",
      "sandi",
      "kata sandi",
      "nama",
      "avatar",
      "foto",
    ],
  },
  {
    id: "menu-public-map",
    title: "Peta publik",
    description:
      "Lihat sebaran zona gambut dan titik panas hotspot satelit publik",
    href: APP_ROUTES.publicMap,
    roles: ["RELAWAN", "POSKO", "VERIFIKATOR"],
    keywords: [
      "peta",
      "publik",
      "peta publik",
      "map",
      "sebaran",
      "pantauan",
      "landing",
      "hotspot",
      "firms",
      "beranda",
    ],
  },

  // RELAWAN
  {
    id: "menu-field-home",
    title: "Beranda patroli",
    description: "Ringkasan status patroli dan riwayat laporan lapangan",
    href: APP_ROUTES.field.home,
    roles: ["RELAWAN"],
    keywords: [
      "beranda",
      "patroli",
      "beranda patroli",
      "home",
      "relawan",
      "lapangan",
      "daftar laporan",
      "status patroli",
    ],
  },
  {
    id: "menu-field-create-report",
    title: "Lapor temuan",
    description:
      "Catat temuan insiden kebakaran, asap, atau kondisi sekat kanal",
    href: APP_ROUTES.field.createReport,
    roles: ["RELAWAN"],
    keywords: [
      "lapor",
      "temuan",
      "lapor temuan",
      "buat",
      "tambah",
      "buat laporan",
      "create",
      "patroli baru",
      "insiden",
      "kebakaran",
      "api",
      "asap",
    ],
  },
  {
    id: "menu-field-queue",
    title: "Antrean laporan",
    description: "Kelola draf offline dan pantau sinkronisasi laporan ke posko",
    href: APP_ROUTES.field.queue,
    roles: ["RELAWAN"],
    keywords: [
      "antrean",
      "laporan",
      "antrean laporan",
      "queue",
      "outbox",
      "draf",
      "riwayat",
      "sinkron",
      "offline",
      "kirim",
    ],
  },

  // POSKO
  {
    id: "menu-command-map",
    title: "Peta komando",
    description:
      "Pantau zona gambut, titik sumber air, dan indikasi hotspot satelit",
    href: APP_ROUTES.command.map,
    roles: ["POSKO"],
    keywords: [
      "peta",
      "komando",
      "peta komando",
      "map",
      "operasi",
      "hotspot",
      "titik panas",
      "firms",
      "satelit",
      "posko",
    ],
  },
  {
    id: "menu-command-reports",
    title: "Daftar insiden",
    description:
      "Tinjau bukti lapangan, nilai urgensi AI, dan tangani laporan insiden",
    href: APP_ROUTES.command.reports,
    roles: ["POSKO"],
    keywords: [
      "daftar",
      "insiden",
      "daftar insiden",
      "laporan",
      "antrean",
      "queue",
      "reports",
      "tindakan",
      "penanganan",
      "verifikasi",
      "masuk",
    ],
  },
  {
    id: "menu-command-zones",
    title: "Zona gambut",
    description:
      "Daftar wilayah kerja, batas poligon, dan parameter emisi gambut",
    href: APP_ROUTES.command.zones,
    roles: ["POSKO"],
    keywords: [
      "zona",
      "gambut",
      "zona gambut",
      "zones",
      "wilayah",
      "area",
      "poligon",
      "parameter",
      "daftar zona",
    ],
  },
  {
    id: "menu-command-create-zone",
    title: "Tambah zona",
    description:
      "Gambar batas poligon peta dan tentukan parameter emisi zona baru",
    href: APP_ROUTES.command.createZone,
    roles: ["POSKO"],
    keywords: [
      "tambah",
      "zona",
      "tambah zona",
      "buat zona",
      "create zone",
      "zona baru",
      "gambar poligon",
      "wilayah baru",
    ],
  },
  {
    id: "menu-command-water-points",
    title: "Titik sumber air",
    description:
      "Kelola lokasi sekat kanal, embung air, dan sumber pemadaman karhutla",
    href: APP_ROUTES.command.waterPoints,
    roles: ["POSKO"],
    keywords: [
      "titik",
      "sumber",
      "air",
      "titik sumber air",
      "titik air",
      "water points",
      "sekat",
      "kanal",
      "embung",
      "pemadaman",
      "logistik air",
    ],
  },
  {
    id: "menu-command-create-water-point",
    title: "Tambah titik air",
    description:
      "Daftarkan sekat kanal, embung, atau sumber air baru ke dalam sistem",
    href: APP_ROUTES.command.createWaterPoint,
    roles: ["POSKO"],
    keywords: [
      "tambah",
      "titik",
      "air",
      "tambah titik air",
      "buat titik air",
      "create water point",
      "sekat baru",
      "embung baru",
      "sumber air baru",
    ],
  },

  // VERIFIKATOR
  {
    id: "menu-audit-dashboard",
    title: "Dampak karbon",
    description:
      "Transparansi estimasi pencegahan emisi gambut dan aktivitas masyarakat",
    href: APP_ROUTES.audit.dashboard,
    roles: ["VERIFIKATOR"],
    keywords: [
      "dampak",
      "karbon",
      "dampak karbon",
      "dashboard",
      "mrv",
      "audit",
      "emisi",
      "insentif",
      "desa",
      "ringkasan",
    ],
  },
  {
    id: "menu-zone-review",
    title: "Verifikasi zona",
    description:
      "Tinjau batas dan setujui zona gambut yang menunggu verifikasi",
    href: APP_ROUTES.audit.zones,
    roles: ["VERIFIKATOR"],
    keywords: ["zona", "persetujuan", "batas zona"],
  },
  {
    id: "menu-audit-ledger",
    title: "Log audit MRV",
    description:
      "Telusuri waktu, lokasi, bukti, triase, dan riwayat penanganan laporan",
    href: APP_ROUTES.audit.ledger,
    roles: ["VERIFIKATOR"],
    keywords: [
      "log",
      "audit",
      "mrv",
      "log audit",
      "log audit mrv",
      "buku besar",
      "ledger",
      "transaksi",
      "audit trail",
      "verifikasi bukti",
      "review",
    ],
  },
  {
    id: "menu-audit-generator",
    title: "Generator laporan",
    description: "Cetak dan terbitkan laporan situasi serta audit karbon resmi",
    href: APP_ROUTES.audit.generator,
    roles: ["POSKO", "VERIFIKATOR"],
    keywords: [
      "generator",
      "laporan",
      "generator laporan",
      "cetak",
      "export",
      "pdf",
      "terbitkan",
      "dokumen",
      "audit karbon",
    ],
  },
  {
    id: "menu-mrv-archive",
    title: "Arsip laporan MRV",
    description: "Buka dan unduh laporan terbit",
    href: APP_ROUTES.audit.documents,
    roles: ["POSKO", "VERIFIKATOR"],
    keywords: ["arsip", "dokumen", "laporan", "pdf"],
  },
];

export function searchMenuCatalog(
  query: string,
  role: AppRole,
): GlobalSearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const lower = trimmed.toLowerCase();
  const searchTerms = lower.split(/\s+/).filter(Boolean);

  const matched = MENU_CATALOG.filter((item) => {
    if (!item.roles.includes(role)) return false;

    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    const keywords = item.keywords.map((k) => k.toLowerCase());

    return searchTerms.every(
      (term) =>
        titleLower.includes(term) ||
        descLower.includes(term) ||
        keywords.some((k) => k.includes(term) || term.includes(k)),
    );
  });

  return matched.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    kind: "Menu",
    group: "menu",
    href: item.href,
  }));
}
