import type { MetadataRoute } from "next";
import { APP_ROUTES } from "@/lib/routes";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PEATGUARD Relawan Lapangan",
    short_name: "PEATGUARD",
    description: "Pencatatan patroli gambut dengan antrean laporan offline.",
    start_url: APP_ROUTES.field.home,
    scope: APP_ROUTES.home,
    display: "standalone",
    background_color: "#f6f7ef",
    theme_color: "#1f4d3d",
    lang: "id",
    categories: ["utilities", "productivity"],
    icons: [
      {
        src: "/manifest-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
