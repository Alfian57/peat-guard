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
        src: "/brand/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/app-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
