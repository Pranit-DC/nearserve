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
      <body className={`${inter.className}`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* Hidden Google Translate Element for programmatic control */}
            <div id="google_translate_element" style={{ display: 'none' }}></div>
            
            {/* Header on all pages for UI consistency */}
            <ConditionalHeader />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />
            {/* Conditional footer - hidden on customer/worker dashboards */}
            <ConditionalFooter />
            <ProjectChatbot />
          </AuthProvider>
        </ThemeProvider>
        
        {/* Google Translate Scripts */}
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement(
                  {
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,mr',
                    autoDisplay: false
                  },
                  'google_translate_element'
                );
              }
            `,
          }}
        />
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
