import type { Metadata } from "next";
import { barlowCondensed, inter, jetBrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PEATGUARD — Lindungi Gambut, Cegah Karhutla",
    template: "%s | PEATGUARD",
  },
  description:
    "Pemantauan gambut, pelaporan patroli, dan transparansi dampak konservasi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${barlowCondensed.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
