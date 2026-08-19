export const FALLBACK_ROUTER_BASE =
  String((import.meta as any).env?.VITE_ROUTER_CUSTOMER_URL || "").trim().replace(/\/+$/, "") ||
  String((import.meta as any).env?.VITE_ROUTER_BASE_URL || "").trim().replace(/\/+$/, "") ||
  "https://router.alvineitsolutions.com/v1";
export function normalizeBase(u: string) { return String(u || "").trim().replace(/\/+$/, ""); }
export async function fetchActiveRouterBase(): Promise<string | null> {
  try {
    const r = await fetch("/api/router-customers/chat/models");
    if (!r.ok) return null;
    const j = await r.json();
    const rows: any[] = j.models ?? j.router_models ?? [];
    const first = rows.find(x => x.base_url) ?? rows[0];
    return first?.base_url ? normalizeBase(first.base_url) : null;
  } catch { return null; }
}
