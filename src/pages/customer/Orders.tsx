import { useEffect, useState } from "react";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";

type Plan = { _id: string; name: string; price: number; credits: number; duration_days: number; features: string[]; status: string };
type Order = {
  _id: string; customer_id: string; plan_id: any; amount: number; credits: number;
  status: "pending" | "paid" | "cancelled" | "expired"; payment_method?: string; payment_ref?: string;
  start_date?: string; due_date?: string; createdAt: string;
};

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const money = (n: number) =>
  n >= 1 ? `$${Number(n).toLocaleString()}` : n.toString().includes(".") ? `$${n}` : `$${n}`;

export default function Orders() {
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [err, setErr] = useState("");
  const [paying, setPaying] = useState<string | null>(null);
  const [placing, setPlacing] = useState<string | null>(null);

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.03)";
  const cardSoft = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const subMuted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const faint = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await fetch("/api/plans?status=active&limit=50");
      const j = await res.json();
      const rows: Plan[] = j.plans ?? j ?? [];
      setPlans(Array.isArray(rows) ? rows : []);
    } catch (e: any) { setErr(e.message || "Failed to load plans"); }
    finally { setLoadingPlans(false); }
  };

  const fetchOrders = async () => {
    if (!token) { setLoadingOrders(false); return; }
    try {
      setLoadingOrders(true);
      const res = await fetch("/api/orders/me?limit=50", { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to load orders");
      setOrders(j.orders ?? []);
    } catch (e: any) { setErr(e.message || "Failed to load orders"); }
    finally { setLoadingOrders(false); }
  };

  useEffect(() => { fetchPlans(); fetchOrders(); }, []);

  const placeOrder = async (planId: string) => {
    if (!token) { setErr("Please sign in again."); return; }
    setErr(""); setPlacing(planId);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: planId, payment_method: "manual" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to create order");
      await fetchOrders();
    } catch (e: any) { setErr(e.message || "Failed to place order"); }
    finally { setPlacing(null); }
  };

  const payOrder = async (orderId: string) => {
    if (!token) return;
    setErr(""); setPaying(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payment_method: "manual", payment_ref: `MANUAL-${Date.now()}` }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Payment failed");
      await fetchOrders();
    } catch (e: any) { setErr(e.message || "Payment failed"); }
    finally { setPaying(null); }
  };

  const cancelOrder = async (orderId: string) => {
    if (!token) return;
    setErr("");
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to cancel");
      await fetchOrders();
    } catch (e: any) { setErr(e.message || "Failed"); }
  };

  const visibleOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ display: "grid", gap: 18, color: fg }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, color: fg }}>Orders</h2>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, border: `1px solid ${border}`, padding: "5px 10px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>Credits billed per 1k tokens · model: auto</span>
      </div>

      {err && <div role="alert" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: isLight ? "#9f1239" : "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{err}</div>}

      <div>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted, marginBottom: 10 }}>CHOOSE A PLAN — ORDER</div>
        {loadingPlans ? (
          <div style={{ color: muted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>Loading plans…</div>
        ) : plans.length === 0 ? (
          <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: cardSoft, padding: 18, fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>
            No active plans yet. Admin → Plans to create one.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }} className="orders-plans">
            {plans.map(p => (
              <div key={p._id} style={{ borderRadius: 16, padding: 16, background: cardBg, border: `1px solid ${border}`, display: "grid", gap: 10, boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 800, color: fg }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 800, color: fg }}>{money(p.price)}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted }}>/ {p.duration_days}d</span>
                  <span style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 11, color: "#6366f1", border: "1px solid rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.12)", padding: "4px 8px", borderRadius: 20 }}>{Number(p.credits).toLocaleString()} credits</span>
                </div>
                {p.features?.length ? <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, lineHeight: 1.7 }}>{p.features.slice(0, 4).join(" · ")}</div> : null}
                <button
                  onClick={() => placeOrder(p._id)}
                  disabled={!!placing}
                  style={{ marginTop: 4, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.35)", background: placing === p._id ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)") : "linear-gradient(135deg,#6366f1,#06b6d4)", color: "#fff", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", fontSize: 13, cursor: placing ? "not-allowed" : "pointer", opacity: placing ? 0.6 : 1 }}
                >
                  {placing === p._id ? "Placing…" : "Order this plan →"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardSoft, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: `1px solid ${border}` }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: fg }}>My orders</h3>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {(["all", "pending", "paid", "cancelled"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "6px 10px", borderRadius: 20, fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase",
                  background: filter === s ? "rgba(99,102,241,0.18)" : isLight ? "#fff" : "rgba(255,255,255,0.04)",
                  color: filter === s ? "#6366f1" : muted,
                  border: filter === s ? "1px solid rgba(99,102,241,0.3)" : `1px solid ${border}`,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, marginLeft: 6 }}>{visibleOrders.length} orders</span>
          </div>
        </div>

        {loadingOrders ? (
          <div style={{ padding: 24, color: muted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>Loading orders…</div>
        ) : visibleOrders.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            No orders yet. Pick a plan above to create your first order.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: subMuted, borderBottom: `1px solid ${faint}` }}>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>DATE</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>PLAN</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>AMOUNT</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>CREDITS</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>STATUS</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>PERIOD</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map(o => {
                  const planName = o.plan_id?.name ?? "—";
                  return (
                    <tr key={o._id} style={{ borderBottom: `1px solid ${faint}` }}>
                      <td style={{ padding: "11px 14px", color: muted, whiteSpace: "nowrap" }}>{fmtDate(o.createdAt)}</td>
                      <td style={{ padding: "11px 14px", color: fg, fontWeight: 600 }}>{planName}</td>
                      <td style={{ padding: "11px 14px", color: fg }}>{money(o.amount)}</td>
                      <td style={{ padding: "11px 14px", color: muted, fontFamily: "DM Mono, monospace" }}>{Number(o.credits).toLocaleString()}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{
                          display: "inline-block", padding: "4px 8px", borderRadius: 20, fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase",
                          background: o.status === "paid" ? "rgba(16,185,129,0.14)" : o.status === "pending" ? "rgba(245,158,11,0.14)" : o.status === "cancelled" ? "rgba(239,68,68,0.12)" : isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${o.status === "paid" ? "rgba(16,185,129,0.25)" : o.status === "pending" ? "rgba(245,158,11,0.25)" : o.status === "cancelled" ? "rgba(239,68,68,0.2)" : border}`,
                          color: o.status === "paid" ? "#10b981" : o.status === "pending" ? "#f59e0b" : o.status === "cancelled" ? (isLight ? "#9f1239" : "#fecaca") : muted,
                        }}>{o.status}</span>
                      </td>
                      <td style={{ padding: "11px 14px", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 12, whiteSpace: "nowrap" }}>{o.status === "paid" ? `${fmtDate(o.start_date)} → ${fmtDate(o.due_date)}` : "—"}</td>
                      <td style={{ padding: "11px 14px" }}>
                        {o.status === "pending" ? (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              onClick={() => payOrder(o._id)}
                              disabled={paying === o._id}
                              style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: paying === o._id ? (isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)") : "rgba(16,185,129,0.15)", color: isLight ? "#065f46" : "#86efac", cursor: paying === o._id ? "not-allowed" : "pointer", opacity: paying === o._id ? 0.6 : 1 }}
                            >
                              {paying === o._id ? "Paying…" : "Pay (mock) →"}
                            </button>
                            <button onClick={() => cancelOrder(o._id)} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.04)", color: muted, cursor: "pointer" }}>Cancel</button>
                          </div>
                        ) : o.status === "paid" ? (
                          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "#10b981" }}>Paid ✓</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.02)", padding: 14, fontFamily: "DM Mono, monospace", fontSize: 11.5, lineHeight: 1.7, color: muted, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
        Payment is mocked (<span style={{ color: "#10b981" }}>Pay</span> flips pending → paid, credits credited, access until due date). Replace <code style={{ color: fg, background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 6 }}>POST /api/orders/:id/pay</code> with gateway webhook for real payments.
      </div>

      <style>{`@media(max-width: 860px){ .orders-plans{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
