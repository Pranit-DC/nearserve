"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pageview } from "@/lib/gtag";

export default function GTagTracker() {
  const pathname = usePathname();
  useEffect(() => {
    pageview(window.location.pathname + window.location.search);
  }, [pathname]);
  return null;
}
