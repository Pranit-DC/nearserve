"use client";

import { type VariantProps } from "class-variance-authority";
import { ArrowRightIcon } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link"

import { cn } from "@/lib/utils";

import Github from "@/components/logos/github";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import Glow from "@/components/ui/glow";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import Screenshot from "@/components/ui/screenshot";
import { Section } from "@/components/ui/section";

interface HeroButtonProps {
  href: string;
  text: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface HeroProps {
  title?: string;
  description?: string;
  mockup?: ReactNode | false;
  badge?: ReactNode | false;
  buttons?: HeroButtonProps[] | false;
  className?: string;
}

// Hoverable mockups: parent gets dimensions so it can receive mouse events
function HoverableMockups({ mockup }: { mockup: ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    console.log('HoverableMockups: isHovered ->', isHovered);
  }, [isHovered]);

  // ---- Editable values: tweak these to change how far/fast layers move/rotate on hover ----
  // ANIM_DURATION: animation duration in seconds (change to speed up/slow down)
  // BACK_X: horizontal translation for the back mockup (px)
  // BACK_ROT: rotation for the back mockup (deg)
  // MID_ROT: rotation for the middle mockup (deg)
  // FRONT_X: horizontal translation for the front mockup (px)
  // FRONT_ROT: rotation for the front mockup (deg)
  const ANIM_DURATION = 0.50;
  const BACK_X = -120;
  const BACK_ROT = 3;
  const MID_ROT = 3;
  const FRONT_X = 150;
  const FRONT_ROT = 3;
  // ---------------------------------------------------------------------------------------
  return (
    <div className="relative mx-auto w-full max-w-[960px] pt-0 pb-32">
      <Glow
        variant="above"
        className="animate-appear-zoom delay-1000 pointer-events-none"
      />

      <div
        className="relative cursor-pointer min-h-[520px] pointer-events-auto"
        style={{ perspective: "1500px", perspectiveOrigin: "50% 50%" }}
        onMouseEnter={(e) => { console.log('HoverableMockups: mouseenter', e.type); setIsHovered(true); }}
        onMouseLeave={(e) => { console.log('HoverableMockups: mouseleave', e.type); setIsHovered(false); }}
        onPointerEnter={(e) => { console.log('HoverableMockups: pointerenter', e.type); setIsHovered(true); }}
        onPointerLeave={(e) => { console.log('HoverableMockups: pointerleave', e.type); setIsHovered(false); }}
      >
        <div
          className="relative mx-auto"
          style={{ transformStyle: "preserve-3d", transform: "rotate(-18deg) skewY(6deg)" }}
        >
          <div
            className="absolute -top-0 -left-38 w-full pointer-events-none"
            style={{
              transform: isHovered ? `translateX(${BACK_X}px) rotate(${BACK_ROT}deg) scale(0.92)` : 'none',
              transformOrigin: 'center center',
              filter: 'blur(0.5px) brightness(0.85)',
              opacity: 0.7,
              transition: `transform ${ANIM_DURATION}s ease-out`
            }}
          >
            <div className="shadow-[0_30px_90px_-20px_rgba(0,0,0,0.5),0_8px_24px_-4px_rgba(0,0,0,0.2)]">
              <MockupFrame size="small" className="shadow-lg">
                <Mockup type="responsive" className="bg-background/50 w-full rounded-xl border border-white/5">
                  {mockup}
                </Mockup>
              </MockupFrame>
            </div>
          </div>

          <div
            className="absolute top-20 left-10 w-full pointer-events-none"
            style={{
              transform: isHovered ? `rotate(${MID_ROT}deg) scale(0.96)` : 'none',
              transformOrigin: 'center center',
              filter: 'blur(0.25px) brightness(0.95)',
              opacity: 0.9,
              transition: `transform ${ANIM_DURATION}s ease-out`
            }}
          >
            <div className="shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4),0_8px_24px_-4px_rgba(0,0,0,0.2)]">
              <MockupFrame size="small" className="shadow-lg">
                <Mockup type="responsive" className="bg-background/70 w-full rounded-xl border border-white/10">
                  {mockup}
                </Mockup>
              </MockupFrame>
            </div>
          </div>

          <div
            className="relative top-40 left-56 z-10 pointer-events-none"
            style={{
              transform: isHovered ? `translateX(${FRONT_X}px) rotate(${FRONT_ROT}deg) scale(1)` : 'none',
              transformOrigin: 'center center',
              transition: `transform ${ANIM_DURATION}s ease-out`
            }}
          >
            <div className="shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35),0_40px_100px_-20px_rgba(0,0,0,0.25),0_8px_24px_-4px_rgba(0,0,0,0.2)]">
              <MockupFrame size="small" className="shadow-xl">
                <Mockup type="responsive" className="bg-background/95 w-full rounded-xl border border-white/20">
                  {mockup}
                </Mockup>
              </MockupFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PremiumHero({
  title = "Find skilled workers near you, instantly",
  description = "The modern platform connecting blue-collar workers with local opportunities. Built for reliability. Designed for growth.",
  mockup = (
    <Screenshot
      srcLight="/customer%20search.png"
      srcDark="/customer%20search_dark.png"
      alt="NearServe dashboard screenshot"
      width={1248}
      height={765}
      className="w-full"
    />
  ),
  badge = (
    <Badge variant="outline" className="animate-appear">
      <span className="text-muted-foreground">
        NearServe is now available!
      </span>
      <Link href="/onboarding" className="flex items-center gap-1">
        Get started
        <ArrowRightIcon className="size-3" />
      </Link>
    </Badge>
  ),
  buttons = [
    {
      href: "/onboarding",
      text: "Get Started",
      variant: "default" as const,
    },
    {
      href: "https://github.com/Pranit-DC/nearserve",
      text: "GitHub",
      variant: "outline" as const,
      icon: <Github className="mr-2 size-4" />,
    },
  ],
  className,
}: HeroProps) {
  return (
    <Section
      className={cn(
        "fade-bottom overflow-hidden pb-0 sm:pb-0 md:pb-0",
        className,
      )}
    >
      <div className="max-w-container mx-auto flex flex-col gap-6 pt-10 sm:gap-12 px-20">
        <div className="flex flex-col items-start gap-5 text-left sm:gap-8 max-w-2xl">
          {badge !== false && badge}
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-linear-to-r bg-clip-text text-3xl leading-tight font-semibold text-balance text-transparent drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-5xl md:leading-tight">
            {title}
          </h1>
          <p className="text-md animate-appear text-muted-foreground relative z-10 max-w-[540px] font-medium text-balance opacity-0 delay-100 sm:text-lg">
            {description}
          </p>
          {buttons !== false && buttons.length > 0 && (
            <div className="animate-appear relative z-10 flex justify-start gap-4 opacity-0 delay-300">
              {buttons.map((button, index) => (
                <Button
                  key={`${button.href}-${index}`}
                  variant={button.variant || "default"}
                  size="lg"
                  asChild
                >
                  <Link href={button.href}>
                    {button.icon}
                    {button.text}
                    {button.iconRight}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Mockups - centered separately */}
        {mockup !== false && <HoverableMockups mockup={mockup} />}
      </div>
    </Section>
  );
}
