import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaInstallProvider } from "@/components/pwa/pwa-install-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { barlowCondensed, inter, jetBrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "PEATGUARD", statusBarStyle: "default" },
  title: {
    default: "PEATGUARD: Lindungi Gambut, Cegah Karhutla",
    template: "%s | PEATGUARD",
  },
  description:
    "Pemantauan gambut, pelaporan patroli, dan transparansi dampak konservasi.",
};

export const viewport: Viewport = {
  themeColor: "#1f4d3d",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${barlowCondensed.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <PwaInstallProvider>{children}</PwaInstallProvider>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
