import { usePageTracking } from "../hooks/usePageTracking";

// Mount once, inside the Router (see main.tsx).
// Fires a GA pageview on every client-side route change.
export default function PageTracker() {
  usePageTracking();
  return null;
}
