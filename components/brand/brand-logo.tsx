import Image from "next/image";

const BRAND_ASSETS = {
  horizontal: { src: "/brand/logo-horizontal.png", width: 1200, height: 374 },
  symbol: { src: "/brand/logo-symbol.png", width: 768, height: 838 },
  circle: { src: "/brand/logo-circle.png", width: 768, height: 767 },
  stacked: { src: "/brand/logo-stacked.png", width: 1024, height: 986 },
} as const;

export function BrandLogo({
  variant = "horizontal",
  tone = "light",
  height = 40,
  decorative = false,
  className = "",
}: {
  variant?: keyof typeof BRAND_ASSETS;
  tone?: "light" | "dark";
  height?: number;
  decorative?: boolean;
  className?: string;
}) {
  const asset = BRAND_ASSETS[variant];
  const isReversed = tone === "dark" && variant !== "circle";

  return (
    <Image
      alt={decorative ? "" : "PEATGUARD"}
      aria-hidden={decorative || undefined}
      className={`inline-block max-w-full shrink-0 object-contain ${className}`}
      height={asset.height}
      loading="eager"
      src={asset.src}
      style={{
        width: (height * asset.width) / asset.height,
        height: "auto",
        // Reverse the same clean silhouette rather than maintaining a second mark.
        filter: isReversed ? "brightness(0) invert(1)" : undefined,
      }}
      unoptimized
      width={asset.width}
    />
  );
}
