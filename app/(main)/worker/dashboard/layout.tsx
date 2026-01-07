"use client";
import DashboardBgEffect from "@/components/DashboardBgEffect";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardBgEffect />
      {children}
    </>
  );
}
