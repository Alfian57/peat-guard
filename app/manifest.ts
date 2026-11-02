import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PEATGUARD Relawan Lapangan",
    short_name: "PEATGUARD",
    description: "Pencatatan patroli gambut dengan antrean laporan offline.",
    start_url: "/field/home",
    scope: "/",
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
