// Google Analytics (gtag.js) helpers.
// The base snippet lives in index.html; these helpers cover SPA route changes
// (react-router navigations don't trigger a full page load, so GA needs a nudge).

export const GA_MEASUREMENT_ID = "G-J2TGBV4KPZ";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageview(path: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: path });
}

export function trackEvent(action: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", action, params);
}
