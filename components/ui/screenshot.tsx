"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ScreenshotProps {
  srcLight: string;
  srcDark?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function Screenshot({
  srcLight,
  srcDark,
  alt,
  width,
  height,
  className,
}: ScreenshotProps) {
  // Render both variants and let CSS decide which to show.
  // - Light image is visible by default and hidden when `.dark` class is present.
  // - Dark image is hidden by default and shown when `.dark` class is present.
  // This avoids JS-driven flashes and works with Next-Themes when it toggles
  // the `dark` class on the document root.
  return (
    <div className={cn("relative", className)} style={{ width, height }} aria-label={alt}>
      <Image
        src={srcLight}
        alt={alt}
        width={width}
        height={height}
        className="block dark:hidden w-full h-auto"
        unoptimized
      />
      {srcDark && (
        <Image
          src={srcDark}
          alt={alt}
          width={width}
          height={height}
          className="hidden dark:block w-full h-auto absolute inset-0"
          unoptimized
        />
      )}
    </div>
  );
}
