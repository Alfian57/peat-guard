import localFont from "next/font/local";

export const inter = localFont({
  src: "./Inter-Variable.ttf",
  display: "swap",
  variable: "--font-inter",
  weight: "100 900",
});

export const barlowCondensed = localFont({
  src: [
    { path: "./BarlowCondensed-Regular.ttf", weight: "400" },
    { path: "./BarlowCondensed-SemiBold.ttf", weight: "600" },
    { path: "./BarlowCondensed-Bold.ttf", weight: "700" },
    { path: "./BarlowCondensed-ExtraBold.ttf", weight: "800" },
  ],
  display: "swap",
  variable: "--font-barlow-condensed",
});

export const jetBrainsMono = localFont({
  src: "./JetBrainsMono.ttf",
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
});
