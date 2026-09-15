import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview } from "../lib/analytics";

// Fires a GA pageview on every client-side route change.
// Mount once, inside the Router (see main.tsx).
export function usePageTracking() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    trackPageview(`${pathname}${search}`);
  }, [pathname, search]);
}
