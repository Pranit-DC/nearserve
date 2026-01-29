"use client";

import { type VariantProps } from "class-variance-authority";
import { ArrowRightIcon } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { motion } from 'motion/react';
import Link from "next/link"

import { cn } from "@/lib/utils";

import Github from "@/components/logos/github";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import Glow from "@/components/ui/glow";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import Screenshot from "@/components/ui/screenshot";
import { Section } from "@/components/ui/section";
import SplitText from "@/components/SplitText";

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
  mockups?: [ReactNode, ReactNode, ReactNode] | false;
  badge?: ReactNode | false;
  buttons?: HeroButtonProps[] | false;
  className?: string;
}

// Hoverable mockups: parent gets dimensions so it can receive mouse events
function HoverableMockups({ mockups }: { mockups: [ReactNode, ReactNode, ReactNode] }) {
  const [isHovered, setIsHovered] = useState(false);

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
        className="relative cursor-pointer min-h-[360px] sm:min-h-[420px] lg:min-h-[520px] pointer-events-auto"
        style={{ perspective: "1500px", perspectiveOrigin: "50% 50%" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
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
              filter: 'blur(0.5px) brightness(0.90)',
              opacity: 1.0,
              transition: `transform ${ANIM_DURATION}s ease-out`
            }}
          >
            <div className="shadow-2xl">
              <MockupFrame size="small" className="shadow-lg">
                <Mockup type="responsive" className="bg-background/50 w-full h-full rounded-xl border border-white/5 max-w-[1248px] flex items-center justify-center" style={{ height: "500px" }}>
                  {mockups[0]}
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
              opacity: 1.0,
              transition: `transform ${ANIM_DURATION}s ease-out`
            }}
          >
            <div className="shadow-xl">
              <MockupFrame size="small" className="shadow-lg">
                <Mockup type="responsive" className="bg-background/70 w-full h-full rounded-xl border border-white/10 max-w-[1248px] flex items-center justify-center" style={{ height: "500px" }}>
                  {mockups[1]}
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
            <div className="shadow-2xl">
              <MockupFrame size="small" className="shadow-xl">
                <Mockup type="responsive" className="bg-background/95 w-full h-full rounded-xl border border-white/20 max-w-[1248px] flex items-center justify-center"style={{ height: "500px" }}>
                  {mockups[2]}
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
  mockups = [
    <Screenshot
      key="mockup-1"
      srcLight="/mockup_1.png"
      srcDark="/mockup_1_dark.png"
      alt="NearServe dashboard screenshot 1"
      width={1248}
      height={765}
      className="w-full"
    />,
    <Screenshot
      key="mockup-2"
      srcLight="/mockup_2.png"
      srcDark="/mockup_2_dark.png"
      alt="NearServe dashboard screenshot 2"
      width={1248}
      height={765}
      className="w-full"
    />,
    <Screenshot
      key="mockup-3"
      srcLight="/mockup_3.png"
      srcDark="/mockup_3_dark.png"
      alt="NearServe dashboard screenshot 3"
      width={1248}
      height={765}
      className="w-full"
    />,
  ],
  badge = (
    <Badge variant="outline">
      <motion.span
        initial={{ filter: 'blur(10px)', opacity: 0, y: -20 }}
        animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="text-muted-foreground"
      >
        NearServe is now available!
      </motion.span>
      <Link href="/onboarding" className="flex items-center gap-1">
        <motion.span
          initial={{ filter: 'blur(10px)', opacity: 0, y: -20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          Get started
        </motion.span>
        <motion.span
          initial={{ filter: 'blur(10px)', opacity: 0, y: -20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center"
        >
          <ArrowRightIcon className="size-3" />
        </motion.span>
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
        "relative overflow-hidden pb-0 sm:pb-0 md:pb-0",
        className,
      )}
    >
      <div className="max-w-container mx-auto flex flex-col gap-6 pt-10 sm:gap-12 px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col items-start gap-5 text-left sm:gap-8 max-w-2xl">
          {badge !== false && badge}
          <SplitText
            text={title}
            tag="h1"
            className="relative z-10 inline-block text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight"
            splitType="words"
            delay={40}
            duration={1}
            ease="power3.out"
            textAlign="left"
          />
          {/* Hidden plain text fallback to help translation services that struggle with split spans */}
          <span className="sr-only">{title}</span>
          <SplitText
            text={description}
            tag="p"
            className="text-lg sm:text-xl text-foreground/80 relative z-10 max-w-[600px] font-medium text-balance animate-fade-in-up delay-100 dark:text-muted-foreground/95"
            splitType="words"
            delay={20}
            duration={0.9}
            ease="power3.out"
            textAlign="left"
          />
          {buttons !== false && buttons.length > 0 && (
            <div className="relative z-10 flex justify-start gap-4">
                  {buttons.map((button, index) => (
                    <motion.div
                      key={`${button.href}-${index}`}
                      initial={{ filter: 'blur(10px)', opacity: 0, y: -16 }}
                      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 + index * 0.06 }}
                      className="inline-block"
                    >
                      <Button
                        variant={button.variant || "default"}
                        size="lg"
                        asChild
                      >
                        <Link href={button.href}>
                          {button.icon && (
                            <motion.span
                              initial={{ filter: 'blur(10px)', opacity: 0, y: -16 }}
                              animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: 0.18 + index * 0.06 }}
                            >
                              {button.icon}
                            </motion.span>
                          )}
                          <span>
                            {button.text}
                          </span>
                          {button.iconRight}
                        </Link>
                      </Button>
                    </motion.div>
                  ))}
            </div>
          )}
        </div>
        
        {/* Mockups - centered separately */}
        {mockups !== false && (
          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 12 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <HoverableMockups mockups={mockups} />
          </motion.div>
        )}
      </div>
      {/* Smooth transition gradient to the next section. Separate elements for light/dark so the dark
          gradient uses the requested HEX color (#0b0f14) while light uses the theme background. */}
      {/* Light mode gradient (falls back to var(--background)) */}
      <div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-36 pointer-events-none block dark:hidden"
        style={{
          background: "linear-gradient(to top, var(--background) 0%, transparent 100%)",
        }}
      />
         {/* Dark mode gradient using theme variable with fallback to HEX #0b0f14 */}
      <div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-36 pointer-events-none hidden dark:block"
        style={{
          background:
            "linear-gradient(to top, var(--premium-hero-dark-background, #0b0f14) 0%, transparent 100%)",
        }}
      />
    </Section>
  );
}
