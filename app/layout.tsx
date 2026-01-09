import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import ConditionalHeader from "@/components/conditional-header";
import { Toaster } from "sonner";
import ConditionalFooter from "@/components/conditional-footer";
import ProjectChatbot from "@/components/ProjectChatbot";
import Script from "next/script";
import { ClientOnly } from "@/components/hydration-boundary";
import { HydrationErrorSuppressor } from "@/components/hydration-error-suppressor";
import { GlobalErrorHandler } from "./global-error-handler";
import { ErrorBoundary } from "./error-boundary";
import { FCMTokenRefresher } from "@/components/fcm-token-refresher";

const inter = Inter({ subsets: ["latin"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NearServe",
  description: "A platform for blue-collar workers and employers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Immediate error suppression - runs before React hydration */}
        <Script
          id="error-suppression"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var suppressError = function(str) {
                  return /hydration|removeChild|notfounderror|did not match|expected server/i.test(str);
                };
                
                var originalError = console.error;
                console.error = function() {
                  var msg = Array.from(arguments).join(' ');
                  if (!suppressError(msg)) originalError.apply(console, arguments);
                };
                
                window.onerror = function(message) {
                  if (suppressError(String(message))) return true;
                  return false;
                };
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalErrorHandler />
          <HydrationErrorSuppressor />
          <ErrorBoundary>
            <AuthProvider>
              {/* Silent FCM token refresher */}
              <FCMTokenRefresher />
              
              {/* Header on all pages for UI consistency */}
              <ConditionalHeader />
              <main className="min-h-screen">{children}</main>
              <Toaster richColors />
              {/* Conditional footer - hidden on customer/worker dashboards */}
              <ConditionalFooter />
              <ClientOnly>
                <ProjectChatbot />
              </ClientOnly>
              
              {/* Hidden Google Translate Element for programmatic control - client side only */}
              <ClientOnly>
                <div id="google_translate_element" style={{ display: 'none' }} suppressHydrationWarning></div>
              </ClientOnly>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
        
        {/* Google Translate Scripts - loaded after hydration */}
        <Script
          id="google-translate-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                try {
                  if (typeof google !== 'undefined' && google.translate && document.getElementById('google_translate_element')) {
                    new google.translate.TranslateElement(
                      {
                        pageLanguage: 'en',
                        includedLanguages: 'en,hi,mr',
                        autoDisplay: false
                      },
                      'google_translate_element'
                    );
                  }
                } catch (e) {
                  console.log('Google Translate init error:', e);
                }
              }
            `,
          }}
        />
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
