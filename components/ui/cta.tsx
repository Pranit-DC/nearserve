import { type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import Glow from "@/components/ui/glow";
import { Section } from "@/components/ui/section";

interface CTAButtonProps {
  href: string;
  text: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface CTAProps {
  title?: string | ReactNode;
  subtitle?: ReactNode;
  buttons?: CTAButtonProps[] | false;
  className?: string;
}

export default function CTA({
  title = "Start building",
  subtitle,
  buttons = [
    {
      href: siteConfig.getStartedUrl,
      text: "Get Started",
      variant: "default",
    },
  ],
  className,
}: CTAProps) {
  return (
    <Section
      className={cn(
        "group relative overflow-hidden bg-white dark:bg-[#0B0F14]",
        className
      )}
    >
      <div className="max-w-container relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8 px-6">
        {typeof title === "string" ? (
          <h2 className="max-w-[640px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight text-gray-900 dark:text-white">
            {title}
          </h2>
        ) : (
          <div className="w-full">{title}</div>
        )}
        {subtitle && <div className="w-full">{subtitle}</div>}
        {buttons !== false && buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {buttons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || "default"}
                size="lg"
                asChild
                className={cn(
                  "min-w-[200px] rounded-xl transform-gpu transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  button.variant === "default"
                    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg hover:scale-105 active:scale-100 hover:shadow-2xl focus-visible:ring-blue-400"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 hover:scale-105 shadow-sm focus-visible:ring-blue-400"
                )}
              >
                <a href={button.href} className="flex items-center gap-3 px-6 py-3">
                  {button.icon}
                  <span className="font-semibold">{button.text}</span>
                  {button.iconRight}
                </a>
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="absolute top-0 left-0 h-full w-full translate-y-[1rem] opacity-80 transition-all duration-500 ease-in-out group-hover:translate-y-[-2rem] group-hover:opacity-100">
        <Glow variant="bottom" />
      </div>
    </Section>
  );
}
