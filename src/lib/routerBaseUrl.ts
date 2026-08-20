// Public customer API — what users curl. NOT the upstream RouterModel.base_url (router.alvineitsolutions.com/v1 is private).
// Using window.location.origin makes localhost:5173 and alvineitsolutions.com both work without env.
export const FALLBACK_ROUTER_BASE = (() => {
  const env = String((import.meta as any).env?.VITE_PUBLIC_API_BASE || "").trim().replace(/\/+$/, "");
  if (env) return env;
  if (typeof window !== "undefined" && window.location?.origin) return `${String(window.location.origin).replace(/\/+$/, "")}/api/router-customers`;
  return "https://alvineitsolutions.com/api/router-customers";
})();
export function normalizeBase(u: string) { return String(u || "").trim().replace(/\/+$/, ""); }
export async function fetchActiveRouterBase(): Promise<string | null> {
  // Keep API so existing pages don't need change; public base is origin-based.
  // Do NOT return RouterModel.base_url — that's the private upstream (router.alvineitsolutions.com/v1).
  return null;
}
