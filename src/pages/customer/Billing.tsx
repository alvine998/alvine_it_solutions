import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";

type Plan = { _id: string; name: string; price: number; credits: number; duration_days: number; features: string[]; status: string };
type Order = { _id: string; plan_id: any; status: "pending" | "paid" | "cancelled" | "expired"; due_date?: string; createdAt: string };

const money = (n: number) => `IDR ${Number(n).toLocaleString("id-ID")}`;

export default function Billing() {
  const { t } = useTranslation();
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [placing, setPlacing] = useState<string | null>(null);
  const [ok, setOk] = useState("");

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.03)";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const subMuted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";

  const fetchAll = async () => {
    try {
      setLoading(true); setErr(""); setOk("");
      const [plansRes, ordersRes] = await Promise.all([
        fetch("/api/plans?status=active&limit=50"),
        token ? fetch("/api/orders/me?limit=50", { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null as any),
      ]);
      const pj = await plansRes.json().catch(() => ({}));
      const rows: Plan[] = pj.plans ?? (Array.isArray(pj) ? pj : []);
      setPlans(Array.isArray(rows) ? rows : []);

      if (ordersRes) {
        const oj = await ordersRes.json().catch(() => ({}));
        if (ordersRes.ok) setOrders(oj.orders ?? []);
      }
    } catch (e: any) { setErr(e.message || "Failed to load billing"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // active = most recent paid order whose due_date is in future (or no due_date)
  const activePlanId: string | null = (() => {
    const paid = orders.filter(o => o.status === "paid").sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const now = Date.now();
    const valid = paid.find(o => !o.due_date || +new Date(o.due_date) > now);
    const p = valid ?? paid[0];
    if (!p) return null;
    const pid = p.plan_id;
    if (!pid) return null;
    return typeof pid === "string" ? pid : pid._id ?? String(pid);
  })();

  const placeOrder = async (planId: string) => {
    if (!token) { setErr("Please sign in again."); return; }
    setErr(""); setOk(""); setPlacing(planId);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: planId, payment_method: "manual" }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed to create order");
      setOk(t("customer.billing.orderCreated", { plan: plans.find(p => p._id === planId)?.name ?? "plan" }));
      await fetchAll();
    } catch (e: any) { setErr(e.message || "Failed to place order"); }
    finally { setPlacing(null); }
  };

  if (loading) return <div style={{ color: muted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{t("customer.billing.loading")}</div>;

  return (
    <div style={{ display: "grid", gap: 16, color: fg }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, color: fg }}>{t("customer.billing.title")}</h2>
        {activePlanId && <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", padding: "4px 9px", borderRadius: 20, color: "#6366f1" }}>{t("customer.billing.activeBadge", { plan: (plans.find(p => p._id === activePlanId)?.name ?? activePlanId).toUpperCase() })}</span>}
        <span style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, border: `1px solid ${border}`, padding: "5px 10px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>{t("customer.common.billedPer1k")}</span>
      </div>

      <p style={{ margin: 0, color: muted, fontSize: 13.5, lineHeight: 1.6 }}>
        {t("customer.billing.plansNote")}
      </p>

      {err && <div role="alert" style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{err}</div>}
      {ok && <div role="status" style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)", color: isLight ? "#065f46" : "#86efac", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{ok} <Link to="/dashboard/orders" style={{ color: isLight ? "#065f46" : "#86efac", textDecoration: "underline" }}>{t("customer.billing.viewOrdersLink")}</Link></div>}

      {plans.length === 0 ? (
        <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: cardBg, padding: 18, fontFamily: "DM Mono, monospace", fontSize: 12, color: muted, lineHeight: 1.7 }}>
          {t("customer.billing.noPlans")}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }} className="billing-grid">
          {plans.map(p => {
            const isActive = activePlanId === p._id;
            const isPlacing = placing === p._id;
            return (
              <div key={p._id} style={{
                borderRadius: 16, padding: 16, display: "grid", gap: 10,
                background: isActive ? (isLight ? "linear-gradient(135deg, rgba(99,102,241,0.10), rgba(6,182,214,0.06))" : "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(6,182,214,0.08))") : cardBg,
                border: isActive ? "1px solid rgba(99,102,241,0.35)" : `1px solid ${border}`,
                boxShadow: isLight && !isActive ? "0 1px 12px rgba(0,0,0,0.04)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: isActive ? "#6366f1" : subMuted }}>{p.name.toUpperCase()} · {p.duration_days}d</span>
                  {isActive && <span style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: 0.6, padding: "4px 8px", borderRadius: 20, background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>{t("customer.billing.current")}</span>}
                </div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 800, color: fg }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 800, color: fg }}>{money(p.price)}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: subMuted }}>/ {p.duration_days}d</span>
                  <span style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 11, color: isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)", border: `1px solid ${border}`, padding: "4px 8px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)" }}>{Number(p.credits).toLocaleString()} credits</span>
                </div>
                {p.features?.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {p.features.slice(0, 5).map((f, i) => (
                      <span key={i} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, border: `1px solid ${border}`, padding: "3px 7px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}>{f}</span>
                    ))}
                  </div>
                ) : <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted }}>{t("customer.billing.modelAutoNote")}</div>}

                <button
                  onClick={() => placeOrder(p._id)}
                  disabled={!!placing}
                  style={{
                    marginTop: 4, padding: "10px 12px", borderRadius: 10, fontFamily: "Space Grotesk, sans-serif", fontSize: 13, fontWeight: 700, cursor: placing ? "not-allowed" : "pointer", opacity: placing && !isPlacing ? 0.6 : 1,
                    background: isActive ? (isLight ? "#1c1917" : "#fff") : isPlacing ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)") : "linear-gradient(135deg,#6366f1,#06b6d4)",
                    color: isActive ? (isLight ? "#fff" : "#0a0a14") : "#fff",
                    border: isActive ? `1px solid ${isLight ? "#1c1917" : "#fff"}` : "1px solid rgba(99,102,241,0.35)",
                  }}
                >
                  {isPlacing ? t("customer.billing.placing") : isActive ? t("customer.billing.renew") : t("customer.billing.choosePlan")}
                </button>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, textAlign: "center" }}>{t("customer.billing.createsPending")}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link to="/dashboard/orders" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "9px 14px", borderRadius: 10, background: isLight ? "#1c1917" : "rgba(255,255,255,0.08)", color: isLight ? "#fff" : "#fff", textDecoration: "none", border: `1px solid ${border}`, fontWeight: 700 }}>{t("customer.billing.goToOrders")}</Link>
        <Link to="/#pricing" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "9px 14px", borderRadius: 10, border: `1px solid ${border}`, background: cardBg, color: fg, textDecoration: "none" }}>{t("customer.billing.viewPricing")}</Link>
        <button onClick={fetchAll} style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "9px 14px", borderRadius: 10, border: `1px solid ${border}`, background: cardBg, color: muted, cursor: "pointer" }}>{t("customer.billing.refreshPlans")}</button>
      </div>

      <style>{`@media(max-width: 860px){ .billing-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
