import { cva, VariantProps } from "class-variance-authority";
import React from "react";

import { cn } from "@/lib/utils";

const glowVariants = cva("absolute w-full", {
  variants: {
    variant: {
      top: "top-0",
      above: "-top-[128px]",
      bottom: "bottom-0",
      below: "-bottom-[128px]",
      center: "top-[50%]",
    },
  },
  defaultVariants: {
    variant: "top",
  },
});

function Glow({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof glowVariants>) {
  return (
    <div
      data-slot="glow"
      className={cn(glowVariants({ variant }), className)}
      {...props}
    >
      <div
        className={cn(
          "absolute left-1/2 h-[400px] w-[60%] -translate-x-1/2 scale-[2] rounded-full bg-gradient-to-r from-blue-500/50 via-purple-500/40 to-pink-500/30 opacity-70 blur-3xl sm:h-[600px]",
          variant === "center" && "-translate-y-1/2",
        )}
      />
      <div
        className={cn(
          "absolute left-1/2 h-[300px] w-[40%] -translate-x-1/2 scale-150 rounded-full bg-gradient-to-r from-violet-500/60 via-indigo-500/50 to-blue-500/40 opacity-60 blur-2xl sm:h-[500px]",
          variant === "center" && "-translate-y-1/2",
        )}
      />
    </div>
  );
}

export default Glow;
