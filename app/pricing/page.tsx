import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing • NearServe",
  description: "Simple platform fee model. Pay only when you complete work.",
};

export default function PricingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-[#0B0F14] dark:to-[#0B0F14]/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/30 mx-auto mb-4">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Transparent Pricing
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
              No subscriptions. No hidden fees. Pay only when work is completed.
            </p>
          </div>

          {/* Platform Fee Model */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="border-2 border-gray-200/60 dark:border-[#2c2c2c] bg-white/80 dark:bg-[#181818] backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="text-center bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent border-b border-gray-200 dark:border-[#2c2c2c] pb-8">
                <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Platform Fee Model</CardTitle>
                <CardDescription className="text-lg mt-3 text-gray-600 dark:text-gray-400">
                  We charge a small platform fee only on completed jobs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* For Customers */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-3 text-gray-900 dark:text-white">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    For Customers
                  </h3>
                  <div className="bg-blue-50/50 dark:bg-[#303030] rounded-xl p-6 border border-blue-200/50 dark:border-[#2c2c2c]">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                        5%
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        platform fee per completed job
                      </span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>Unlimited job postings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>Browse all worker profiles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>Direct messaging with workers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>24/7 customer support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>Secure payment processing</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* For Workers */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-3 text-gray-900 dark:text-white">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="currentColor"
                      >
                        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                      </svg>
                    </div>
                    For Workers
                  </h3>
                  <div className="bg-blue-50/50 dark:bg-[#303030] rounded-xl p-6 border border-blue-200/50 dark:border-[#2c2c2c]">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                        10%
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        platform fee per completed job
                      </span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>Unlimited job leads</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>Professional profile showcase</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>Direct communication with customers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>Fast & secure payments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        </span>
                        <span>24/7 support & dispute resolution</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Example Calculation */}
                <div className="border-t border-gray-200 dark:border-[#2c2c2c] pt-6">
                  <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Example Calculation</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200/50 dark:border-blue-800/30">
                      <p className="font-semibold mb-3 text-gray-900 dark:text-white">Customer pays:</p>
                      <p className="text-gray-600 dark:text-gray-400">Job cost: ₹1,000</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Platform fee (5%): ₹50
                      </p>
                      <p className="font-bold text-lg mt-3 text-blue-600 dark:text-blue-400">
                        Total: ₹1,050
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 border border-blue-200/50 dark:border-blue-800/30">
                      <p className="font-semibold mb-3 text-gray-900 dark:text-white">Worker receives:</p>
                      <p className="text-gray-600 dark:text-gray-400">Job cost: ₹1,000</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Platform fee (10%): -₹100
                      </p>
                      <p className="font-bold text-lg mt-3 text-blue-600 dark:text-blue-400">
                        Earnings: ₹900
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pt-6 pb-8">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                  <Link href="/sign-up">Get Started Free</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Key Benefits */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Why NearServe?</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-[#303030] dark:to-[#181818] border border-gray-200 dark:border-[#2c2c2c] hover:shadow-lg transition-all">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                    </svg>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white block mb-2">
                  No subscriptions
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No monthly fees or commitments
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-[#303030] dark:to-[#181818] border border-gray-200 dark:border-[#2c2c2c] hover:shadow-lg transition-all">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white block mb-2">
                  Pay per use
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Only charged on completed work
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-[#303030] dark:to-[#181818] border border-gray-200 dark:border-[#2c2c2c] hover:shadow-lg transition-all">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white block mb-2">
                  Secure payments
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Safe and encrypted transactions
                </p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-[#303030] dark:to-[#181818] border border-gray-200 dark:border-[#2c2c2c] hover:shadow-lg transition-all">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white block mb-2">
                  Instant access
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start using all features immediately
                </p>
              </div>
            </div>
          </div>

          {/* FAQ teaser */}
          <p className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
            Have questions about pricing? Reach out at
            <a
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1 font-medium"
              href="mailto:support@nearserve.com"
            >
              support@nearserve.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
