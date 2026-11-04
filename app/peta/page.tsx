import type { Metadata } from "next";

import { PublicMapPage } from "@/components/public/public-map-page";

export const metadata: Metadata = {
  title: "Peta pantauan publik | PEATGUARD",
  description:
    "Jelajahi zona gambut yang disetujui dan indikasi hotspot NASA FIRMS dengan filter waktu, sumber, keyakinan, dan area peta.",
};

export default function PublicMapRoute() {
  return <PublicMapPage />;
}
