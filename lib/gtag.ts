export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-KL84SJST7M";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const pageview = (url: string) => {
  window.gtag?.("config", GA_ID, { page_path: url });
};
