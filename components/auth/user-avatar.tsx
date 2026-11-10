"use client";

import { useState } from "react";
import Image from "next/image";

import { API_ROUTES } from "@/lib/routes";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "PG"
  );
}

export function UserAvatar({
  name,
  image,
  className = "size-10",
}: {
  name: string;
  image: string | null;
  className?: string;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const safeImage =
    image?.startsWith(API_ROUTES.profile.avatarPrefix) ||
    image?.startsWith("blob:")
      ? image
      : null;

  const imageFailed = safeImage !== null && failedImage === safeImage;

  return (
    <span
      aria-label={`Avatar ${name}`}
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#dce8d8] to-[#f3dfad] text-xs font-bold text-peat-forest ring-1 ring-white ${className}`}
      role="img"
    >
      {safeImage && !imageFailed ? (
        <Image
          alt=""
          className="absolute inset-0 size-full object-cover"
          fill
          onError={() => setFailedImage(safeImage)}
          sizes="96px"
          src={safeImage}
          unoptimized
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
