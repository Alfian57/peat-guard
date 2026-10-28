import localFont from "next/font/local";

export const inter = localFont({
  src: "./fonts/Inter-Variable.ttf",
  display: "swap",
  variable: "--font-inter",
  weight: "100 900",
});

export const barlowCondensed = localFont({
  src: [
    { path: "./fonts/BarlowCondensed-Regular.ttf", weight: "400" },
    { path: "./fonts/BarlowCondensed-SemiBold.ttf", weight: "600" },
    { path: "./fonts/BarlowCondensed-Bold.ttf", weight: "700" },
    { path: "./fonts/BarlowCondensed-ExtraBold.ttf", weight: "800" },
  ],
  display: "swap",
  variable: "--font-barlow-condensed",
});

export const jetBrainsMono = localFont({
  src: "./fonts/JetBrainsMono.ttf",
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
});
