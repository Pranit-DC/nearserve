import { type VariantProps } from "class-variance-authority";
import { ArrowRightIcon } from "lucide-react";
import { ReactNode } from "react";
import Link from "next/link";

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

export default function Hero({
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
      text: "Github",
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
      <div className="max-w-container mx-auto flex flex-col gap-6 pt-8 sm:gap-12">
        <div className="flex flex-col items-center gap-5 text-center sm:gap-10">
          {badge !== false && badge}
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-linear-to-r bg-clip-text text-3xl leading-tight font-semibold text-balance text-transparent drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight">
            {title}
          </h1>
          <p className="text-md animate-appear text-muted-foreground relative z-10 max-w-[740px] font-medium text-balance opacity-0 delay-100 sm:text-xl">
            {description}
          </p>
          {buttons !== false && buttons.length > 0 && (
            <div className="animate-appear relative z-10 flex justify-center gap-4 opacity-0 delay-300">
              {buttons.map((button, index) => (
                <Button
                  key={index}
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
          {mockup !== false && (
            <div className="relative mx-auto w-full max-w-6xl pt-20 pb-32">
              <Glow
                variant="above"
                className="animate-appear-zoom delay-1000 pointer-events-none"
              />
              
              {/* 3D perspective container */}
              <div className="relative" style={{ perspective: '2500px', perspectiveOrigin: 'center top' }}>
                <div className="relative mx-auto" style={{ transformStyle: 'preserve-3d' }}>
                  
                  {/* Back layer - slight left */}
                  <div 
                    className="animate-appear delay-900 absolute top-5 -left-28 w-full"
                    style={{
                      transform: 'translateZ(-180px) rotateX(-12deg) rotateY(-6deg) scale(0.92)',
                      transformOrigin: 'center center',
                      filter: 'blur(0.5px) brightness(0.6)',
                      opacity: 0.5,
                    }}
                  >
                    <div className="shadow-[0_30px_90px_-20px_rgba(0,0,0,0.5)]">
                      <MockupFrame size="small">
                        <Mockup
                          type="responsive"
                          className="bg-background/50 w-full rounded-xl border border-white/5"
                        >
                          {mockup}
                        </Mockup>
                      </MockupFrame>
                    </div>
                  </div>
                  
                  {/* Middle layer - center */}
                  <div 
                    className="animate-appear delay-800 absolute top-30 left-0 w-full"
                    style={{
                      transform: 'translateZ(-90px) rotateX(-10deg) rotateY(-5deg) scale(0.96)',
                      transformOrigin: 'center center',
                      filter: 'blur(0.25px) brightness(0.75)',
                      opacity: 0.7,
                    }}
                  >
                    <div className="shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)]">
                      <MockupFrame size="small">
                        <Mockup
                          type="responsive"
                          className="bg-background/70 w-full rounded-xl border border-white/10"
                        >
                          {mockup}
                        </Mockup>
                      </MockupFrame>
                    </div>
                  </div>
                  
                  {/* Front layer - slight right */}
                  <div 
                    className="animate-appear delay-700 relative top-55 left-28 z-10"
                    style={{
                      transform: 'translateZ(0) rotateX(-8deg) rotateY(-3deg) scale(1)',
                      transformOrigin: 'center center',
                    }}
                  >
                    <div className="shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35),0_40px_100px_-20px_rgba(0,0,0,0.25)]">
                      <MockupFrame size="small">
                        <Mockup
                          type="responsive"
                          className="bg-background/95 w-full rounded-xl border border-white/20"
                        >
                          {mockup}
                        </Mockup>
                      </MockupFrame>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
