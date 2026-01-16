"use client";
import { useEffect, useState } from "react";
import Lenis from "lenis";
import { motion } from "framer-motion";
import { MainMenusGradientCard } from "@/components/eldoraui/animatedcard";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import PremiumHero from "@/components/premium-hero";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import ScrollText from "@/components/kokonutui/scroll-text";
import TypewriterTitle from "@/components/kokonutui/type-writer";
import ShimmerText from "@/components/kokonutui/shimmer-text";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import CTA from "@/components/ui/cta";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isFeaturesLoading, setIsFeaturesLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    // Simple Lenis setup that works better with sticky elements
    const lenis = new Lenis();

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Simulate loading states
    const featuresTimer = setTimeout(() => setIsFeaturesLoading(false), 2000);

    // Scroll to top button visibility
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollTop(scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      lenis.destroy();
      clearTimeout(featuresTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mounted]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative bg-slate-900">
      <div className="bg-white dark:bg-[#0B0F14] text-foreground pb-0 rounded-b-[3rem] relative z-10">
        {/* Hero Section with Premium Hero */}
        <PremiumHero />

        {/* Platform Demo Section */}
        <div className="flex flex-col overflow-hidden">
          <ContainerScroll
            titleComponent={
              <>
                <h1 className="text-4xl font-semibold text-black dark:text-white">
                  Experience NearServe in Action <br />
                  <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                    Your Success Platform
                  </span>
                </h1>
              </>
            }
            videoSrc="/premium_Hero_section.mp4"
            poster="/customer_search_dark.png"
            showOnline={true}
            autoplay={true}
            muted={true}
            loop={true}
          >
            <></>
          </ContainerScroll>
        </div>

        {/* Features Section */}
        <section id="feature-section" className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-gray-900 dark:text-white mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover how NearServe empowers skilled workers and customers with
              technology, trust, and support.
            </p>
          </div>

          {isFeaturesLoading ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-6 gap-4">
              <div className="md:col-span-3 p-2">
                <div className="h-64 rounded-lg border p-6 space-y-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-32 mx-auto" />
                </div>
              </div>
              <div className="md:col-span-3 p-2">
                <div className="h-64 rounded-lg border p-6 space-y-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-32 mx-auto" />
                </div>
              </div>
              <div className="md:col-span-4 p-2">
                <div className="h-64 rounded-lg border p-6 space-y-4">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-36 mx-auto" />
                </div>
              </div>
              <div className="md:col-span-2 p-2">
                <div className="h-64 rounded-lg border p-6 space-y-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-24 mx-auto" />
                </div>
              </div>
              <div className="md:col-span-3 p-2">
                <div className="h-64 rounded-lg border p-6 space-y-4">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex justify-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-32 mx-auto" />
                </div>
              </div>
              <div className="md:col-span-3 p-2">
                <div className="h-64 rounded-lg border p-6 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-28 mx-auto" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-6 gap-4">
              {/* Card 1 - Find Work */}
              <div className={cn("p-2 rounded-lg", "md:col-span-3")}>
                <MainMenusGradientCard
                  title="Find Work"
                  description="Discover opportunities that match your skills and location preferences with our smart matching system."
                  withArrow={false}
                  circleSize={300}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-5xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-10 h-10"
                        fill="currentColor"
                      >
                        <path d="M14,2.5c0-1.381,1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5-1.119,2.5-2.5,2.5-2.5-1.119-2.5-2.5Zm9.171,9.658l-2.644-1.322-1.694-2.54c-.958-1.438-2.562-2.296-4.289-2.296-.509,0-1.015,.075-1.5,.223l-3.882,1.181c-.706,.215-1.278,.728-1.569,1.407l-.471,1.098c-.326,.761,.026,1.643,.788,1.97,.761,.327,1.643-.025,1.97-.788l.379-.885,2.585-.786-.751,3.21c-.351,1.5,.339,3.079,1.679,3.84l4.229,2.402v3.627c0,.829,.671,1.5,1.5,1.5s1.5-.671,1.5-1.5v-3.918c0-.897-.484-1.73-1.265-2.174l-3.229-1.834,.834-3.109,.764,1.146c.241,.361,.574,.655,.962,.85l2.763,1.381c.215,.107,.444,.159,.67,.159,.55,0,1.08-.304,1.343-.83,.37-.741,.07-1.642-.671-2.013Zm-9.5,6c-.739-.369-1.641-.069-2.013,.671l-1.5,3c-.37,.741-.07,1.642,.671,2.013,.215,.107,.444,.159,.67,.159,.55,0,1.08-.304,1.343-.83l1.5-3c.37-.741,.07-1.642-.671-2.013Zm-3.78,.461l-.826,1.676c-.566,1.149-1.953,1.629-3.108,1.075l-4.63-2.22c-1.173-.562-1.662-1.975-1.086-3.142l.832-1.689c.568-1.152,1.958-1.63,3.114-1.072l.152,.073,.105-.226c.352-.755,1.251-1.079,2.003-.721l1.582,.751c.745,.354,1.064,1.241,.716,1.988l-.13,.273,.195,.094c1.169,.565,1.654,1.974,1.081,3.139Z" />
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-black dark:text-white">
                      Opportunity Awaits
                    </div>
                  </div>
                </MainMenusGradientCard>
              </div>

              {/* Card 2 - Get Paid */}
              <div className={cn("p-2 rounded-lg", "md:col-span-3")}>
                <MainMenusGradientCard
                  title="Get Paid"
                  description="Fast, reliable payments through trusted gateways. Transparent pricing for every job."
                  withArrow={false}
                  circleSize={300}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-5xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-10 h-10"
                        fill="currentColor"
                      >
                        <path d="M13.053,5.079c.971-.909,2.344-2.36,2.894-3.744,.255-.641-.257-1.335-.947-1.335h-6c-.69,0-1.202,.693-.947,1.335,.55,1.384,1.923,2.835,2.894,3.744C5.569,5.878,1,12.618,1,18c0,3.309,2.691,6,6,6h10c3.309,0,6-2.691,6-6,0-5.382-4.569-12.122-9.947-12.921Zm-2.409,8.682l3.042,.507c1.341,.223,2.315,1.373,2.315,2.733,0,1.654-1.346,3-3,3v1c0,.552-.448,1-1,1s-1-.448-1-1v-1h-.268c-1.068,0-2.063-.574-2.598-1.499-.276-.478-.113-1.089,.365-1.366,.476-.277,1.089-.114,1.366,.365,.178,.308,.511,.5,.867,.5h2.268c.551,0,1-.449,1-1,0-.378-.271-.698-.644-.76l-3.042-.507c-1.341-.223-2.315-1.373-2.315-2.733,0-1.654,1.346-3,3-3v-1c0-.552,.448-1,1-1s1,.448,1,1v1h.268c1.067,0,2.063,.575,2.598,1.5,.276,.478,.113,1.089-.365,1.366-.477,.277-1.089,.114-1.366-.365-.179-.309-.511-.5-.867-.5h-2.268c-.551,0-1,.449-1,1,0,.378,.271,.698,.644,.76Z" />
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-black dark:text-white">
                      Fast & Reliable Payments
                    </div>
                  </div>
                </MainMenusGradientCard>
              </div>

              {/* Card 3 - Nearby Connections */}
              <div className={cn("p-2 rounded-lg", "md:col-span-4")}>
                <MainMenusGradientCard
                  title="Location-Based Matching"
                  description="Connect with workers in your area for quick and efficient hiring with location-based matching."
                  withArrow={false}
                  circleSize={300}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-5xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 304 432"
                        className="w-10 h-10"
                        fill="currentColor"
                      >
                        <path d="M149 3q62 0 106 43.5T299 152q0 31-15.5 71.5t-37.5 75t-44 65t-37 48.5l-16 17q-6-6-16-18t-35.5-46.5t-45.5-67T16 224T0 152Q0 90 43.5 46.5T149 3zm0 202q22 0 38-15.5t16-37.5t-16-37.5T149 99t-37.5 15.5T96 152t15.5 37.5T149 205z" />
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-black dark:text-white">
                      Local Opportunities
                    </div>
                  </div>
                </MainMenusGradientCard>
              </div>

              {/* Card 4 - Ratings & Reviews */}
              <div className={cn("p-2 rounded-lg", "md:col-span-2")}>
                <MainMenusGradientCard
                  title="Ratings & Reviews"
                  description="Build your reputation and choose trusted partners with transparent feedback."
                  withArrow={false}
                  circleSize={300}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-4xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-8 h-8"
                        fill="currentColor"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </div>
                    <div className="text-base font-semibold text-black dark:text-white">
                      Reputation Matters
                    </div>
                  </div>
                </MainMenusGradientCard>
              </div>

              {/* Card 5 - Verified Profiles */}
              <div className={cn("p-2 rounded-lg", "md:col-span-2")}>
                <MainMenusGradientCard
                  title="Verified Profiles"
                  description="Work with trusted professionals. Profiles are verified for identity and skills."
                  withArrow={false}
                  circleSize={300}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-4xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 15 15"
                        className="w-8 h-8"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M0 7.5a7.5 7.5 0 1 1 15 0a7.5 7.5 0 0 1-15 0Zm7.072 3.21l4.318-5.398l-.78-.624l-3.682 4.601L4.32 7.116l-.64.768l3.392 2.827Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-base font-semibold text-black dark:text-white">
                      Trusted & Verified
                    </div>
                  </div>
                </MainMenusGradientCard>
              </div>

              {/* Card 6 - Trust & Safety */}
              <div className={cn("p-2 rounded-lg", "md:col-span-4")}>
                <MainMenusGradientCard
                  title="Trust & Safety"
                  description="Ratings, reviews, and dispute support ensure a safe experience for everyone."
                  withArrow={false}
                  circleSize={300}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-5xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 24"
                        className="w-10 h-10"
                        fill="currentColor"
                      >
                        <path d="M17 13V3h-7v17.766a22.036 22.036 0 0 0 3.376-2.177l-.048.036Q17 15.751 17 13zm3-12v12a7.15 7.15 0 0 1-.541 2.712l.017-.048a9.968 9.968 0 0 1-1.315 2.37l.018-.026a14.545 14.545 0 0 1-1.827 1.98l-.013.012a21.487 21.487 0 0 1-1.915 1.567l-.062.043q-.906.64-1.89 1.211t-1.398.774t-.664.313a.932.932 0 0 1-.818-.002l.005.002q-.25-.11-.664-.313t-1.398-.774t-1.89-1.211a21.613 21.613 0 0 1-1.996-1.624l.015.014a14.574 14.574 0 0 1-1.815-1.958l-.025-.034a9.813 9.813 0 0 1-1.273-2.277l-.024-.067a7.034 7.034 0 0 1-.523-2.663V1c.008-.549.451-.992.999-1h18.001c.549.008.992.451 1 .999V1z" />
                      </svg>
                    </div>
                    <div className="text-lg font-semibold text-black dark:text-white">
                      Safe & Reliable
                    </div>
                  </div>
                </MainMenusGradientCard>
              </div>
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Three simple steps to transform your career
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Scroll Text Animation */}
            <div className="order-2 lg:order-1">
              <ScrollText
                texts={[
                  "Create Profile",
                  "Showcase Skills",
                  "Find Local Jobs",
                  "Apply Instantly",
                  "Work & Deliver",
                  "Get Paid Fast",
                  "Build Reputation",
                  "Grow Your Career",
                ]}
                className="h-[400px]"
              />
            </div>

            {/* Right side - Step Cards */}
            <div className="order-1 lg:order-2 space-y-8">
              <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/30 dark:to-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800/30">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Create Your Professional Profile
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Sign up in minutes and showcase your skills, experience, and
                    availability. Add photos, certifications, and set your
                    service rates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/30 dark:to-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800/30">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Connect with Local Opportunities
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Our smart matching system finds jobs near you that match
                    your skills. Browse, apply, and negotiate terms directly
                    with customers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/30 dark:to-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800/30">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Work Smart, Get Paid Instantly
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Complete your work with confidence. Our secure payment
                    system ensures you get paid immediately after job
                    completion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <ShimmerText
              text="What Workers Say"
              className="text-5xl font-light mb-4"
            />
            <TypewriterEffect
              words={[
                { text: "Real" },
                { text: "stories" },
                { text: "from" },
                { text: "our" },
                {
                  text: "community",
                  className: "text-blue-500 dark:text-blue-400",
                },
              ]}
              className="text-xl text-gray-600 dark:text-gray-400"
              cursorClassName="bg-blue-500"
            />
          </div>

          {/* Infinite Moving Testimonials */}
          <div className="relative">
            <InfiniteMovingCards
              items={[
                {
                  quote:
                    "NearServe changed my life. I found steady work and the payments are always on time.",
                  name: "Rajesh Kumar",
                  title: "Electrician",
                },
                {
                  quote:
                    "The platform is easy to use. I can find work near my home and get paid instantly.",
                  name: "Priya Sharma",
                  title: "Cleaner",
                },
                {
                  quote:
                    "Great platform for contractors. Professional, reliable, and secure payments.",
                  name: "Amit Singh",
                  title: "Plumber",
                },
                {
                  quote:
                    "Finding consistent work was a challenge. NearServe gave me the stability I needed.",
                  name: "Deepak Verma",
                  title: "Painter",
                },
                {
                  quote:
                    "Excellent support and user-friendly app. I recommend NearServe to all workers.",
                  name: "Sunita Devi",
                  title: "Cook",
                },
                {
                  quote:
                    "Quick payments, verified customers, and transparent pricing. Much more rewarding.",
                  name: "Mohammad Ali",
                  title: "Carpenter",
                },
              ]}
              direction="right"
              speed="slow"
              pauseOnHover={true}
            />
          </div>
        </section>

        {/* CTA Section - Enhanced with Glow Effect */}
        <div className="relative">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f1f1_1px,transparent_1px),linear-gradient(to_bottom,#f1f1f1_1px,transparent_1px)] bg-[size:6rem_4rem] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] opacity-20"></div>

          <CTA
            title={
              <div className="space-y-4">
                {/* Apple-style overline */}
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/30 mx-auto">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Transform Your Future
                  </span>
                </div>

                {/* Enhanced Headline with TypeWriter */}
                <div>
                  <h2 className="text-5xl md:text-6xl font-thin text-gray-900 dark:text-white mb-2 tracking-tight">
                    Ready to
                  </h2>
                  <TypewriterTitle
                    sequences={[
                      {
                        text: "transform your career",
                        deleteAfter: true,
                        pauseAfter: 2000,
                      },
                      {
                        text: "unlock new opportunities",
                        deleteAfter: true,
                        pauseAfter: 2000,
                      },
                      {
                        text: "build your future",
                        deleteAfter: true,
                        pauseAfter: 2000,
                      },
                      {
                        text: "start earning more",
                        deleteAfter: false,
                        pauseAfter: 3000,
                      },
                    ]}
                    typingSpeed={80}
                    startDelay={1000}
                    autoLoop={true}
                    loopDelay={3000}
                  />
                </div>

                {/* Subtitle */}
                <p className="text-lg md:text-xl font-light text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed pt-4">
                  Join over{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    10,000+ skilled workers
                  </span>{" "}
                  who have already discovered better opportunities and secured
                  their financial future with NearServe.
                </p>
              </div>
            }
            buttons={[
              {
                href: "/onboarding",
                text: "Start Your Journey",
                variant: "default",
              },
              {
                href: "#feature-section",
                text: "Learn More",
                variant: "outline",
              },
            ]}
            className="py-20 sm:py-24 md:py-32"
          />
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 group inline-flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-1 max-sm:bottom-20"
            aria-label="Scroll to top"
          >
            <svg
              className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </motion.button>
        )}
      </div>
    </div>
  );
}
