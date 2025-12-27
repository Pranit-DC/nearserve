import { cn } from "@/lib/utils";
import React from "react";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Section({ className, children, ...props }: SectionProps) {
  return (
    <section
      className={cn("py-16 sm:py-20 md:py-24", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export default Section;
