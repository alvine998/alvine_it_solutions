import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";

type Plan = { _id: string; name: string; price: number; credits: number; duration_days: number; features: string[]; status: string };
type Order = {
  _id: string; customer_id: string; plan_id: any; amount: number; credits: number;
  status: "pending" | "awaiting_verification" | "paid" | "cancelled" | "expired"; payment_method?: string; payment_ref?: string;
  evidence_url?: string;
  start_date?: string; due_date?: string; createdAt: string;
};
type PaymentMethodRow = { _id: string; name: string; type: "qris" | "bank" | "e-wallet"; account_holder: string; account_number: string; image?: string; status: string };

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const money = (n: number) => `IDR ${Number(n).toLocaleString("id-ID")}`;

export default function Orders() {
  const { t } = useTranslation();
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const [searchParams, setSearchParams] = useSearchParams();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([]);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [err, setErr] = useState("");
  const [paying, setPaying] = useState<string | null>(null);
  const [placing, setPlacing] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<Order | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [payResult, setPayResult] = useState<{ referral?: any; credit_balance?: number } | null>(null);
  const [modalStep, setModalStep] = useState<"pay" | "submitted" | "done">("pay");
  const [telegram, setTelegram] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceUploading, setEvidenceUploading] = useState(false);

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.03)";
  const cardSoft = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const subMuted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const faint = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const statusLabels: Record<string, string> = {
    all: t("customer.orders.filterAll"),
    pending: t("customer.orders.filterPending"),
    awaiting_verification: t("customer.orders.filterAwaiting"),
    paid: t("customer.orders.filterPaid"),
    cancelled: t("customer.orders.filterCancelled"),
  };

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

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/payment-methods?status=active&limit=50");
      const j = await res.json();
      const rows: PaymentMethodRow[] = j.payment_methods ?? (Array.isArray(j) ? j : []);
      setPaymentMethods(Array.isArray(rows) ? rows : []);
    } catch { /* payment methods are optional — fall back to manual */ }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const j = await res.json();
      if (res.ok) setTelegram(j.telegram_username || "");
    } catch { /* settings are optional */ }
  };

  useEffect(() => { fetchPlans(); fetchOrders(); fetchPaymentMethods(); fetchSettings(); }, []);

  // plan chosen from the marketing pricing page (?plan=<id>) — create its order once plans load
  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (!planParam) return;
    if (plans.length === 0 || loadingPlans) return;
    const target = plans.find(p => p._id === planParam);
    if (!target) { setErr("Selected plan is no longer available."); return; }
    setSearchParams({}, { replace: true });
    placeOrder(target._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, loadingPlans, searchParams]);

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

  const openPayModal = (order: Order) => {
    setPayTarget(order);
    setSelectedMethod(paymentMethods[0]?._id ?? "");
    setPayResult(null);
    setModalStep("pay");
    setEvidenceUrl("");
    setErr("");
  };

  const closePayModal = () => {
    setPayTarget(null);
    setPayResult(null);
    setModalStep("pay");
    setEvidenceUrl("");
  };

  const uploadEvidence = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Please choose an image of your payment proof."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("Image must be under 5 MB."); return; }
    setErr(""); setEvidenceUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/orders/upload-evidence", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to upload evidence");
      setEvidenceUrl(j.url);
    } catch (e: any) { setErr(e.message || "Failed to upload evidence"); }
    finally { setEvidenceUploading(false); }
  };

  const confirmPay = async (orderId: string) => {
    if (!token) return;
    if (!evidenceUrl) { setErr("Please upload your payment proof before confirming."); return; }
    setErr(""); setPaying(orderId);
    try {
      const method = paymentMethods.find(m => m._id === selectedMethod);
      const res = await fetch(`/api/orders/${orderId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          evidence_url: evidenceUrl,
          payment_method: method ? `${method.type}:${method.name}` : "manual",
          payment_ref: method ? `${method.name}-${Date.now()}` : `MANUAL-${Date.now()}`,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed to submit payment");
      setModalStep("submitted");
      await fetchOrders();
    } catch (e: any) { setErr(e.message || "Failed to submit payment"); }
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
        <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, color: fg }}>{t("customer.orders.title")}</h2>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, border: `1px solid ${border}`, padding: "5px 10px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>{t("customer.common.billedPer1k")}</span>
      </div>

      {err && <div role="alert" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: isLight ? "#9f1239" : "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{err}</div>}

      <div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted, marginBottom: 10 }}>{t("customer.orders.choosePlan")}</div>
        {loadingPlans ? (
          <div style={{ color: muted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{t("customer.orders.loadingPlans")}</div>
        ) : plans.length === 0 ? (
          <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: cardSoft, padding: 18, fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>
            {t("customer.orders.noPlans")}
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
                  {placing === p._id ? t("customer.orders.placing") : t("customer.orders.orderThisPlan")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardSoft, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: `1px solid ${border}` }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: fg }}>{t("customer.orders.myOrders")}</h3>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {(["all", "pending", "awaiting_verification", "paid", "cancelled"] as const).map(s => (
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
                {statusLabels[s]}
              </button>
            ))}
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, marginLeft: 6 }}>{t("customer.orders.countOrders", { count: visibleOrders.length })}</span>
          </div>
        </div>

        {loadingOrders ? (
          <div style={{ padding: 24, color: muted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>{t("customer.orders.loadingOrders")}</div>
        ) : visibleOrders.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>
            {t("customer.orders.noOrders")}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: subMuted, borderBottom: `1px solid ${faint}` }}>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.orders.colDate")}</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.orders.colPlan")}</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.orders.colAmount")}</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.orders.colCredits")}</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.orders.colStatus")}</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.orders.colPeriod")}</th>
                  <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.orders.colAction")}</th>
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
                          background: o.status === "paid" ? "rgba(16,185,129,0.14)" : o.status === "pending" ? "rgba(245,158,11,0.14)" : o.status === "awaiting_verification" ? "rgba(99,102,241,0.14)" : o.status === "cancelled" ? "rgba(239,68,68,0.12)" : isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${o.status === "paid" ? "rgba(16,185,129,0.25)" : o.status === "pending" ? "rgba(245,158,11,0.25)" : o.status === "awaiting_verification" ? "rgba(99,102,241,0.3)" : o.status === "cancelled" ? "rgba(239,68,68,0.2)" : border}`,
                          color: o.status === "paid" ? "#10b981" : o.status === "pending" ? "#f59e0b" : o.status === "awaiting_verification" ? "#a5b4fc" : o.status === "cancelled" ? (isLight ? "#9f1239" : "#fecaca") : muted,
                        }}>{statusLabels[o.status] ?? o.status}</span>
                      </td>
                      <td style={{ padding: "11px 14px", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 12, whiteSpace: "nowrap" }}>{o.status === "paid" ? `${fmtDate(o.start_date)} → ${fmtDate(o.due_date)}` : t("customer.orders.periodDash")}</td>
                      <td style={{ padding: "11px 14px" }}>
                        {o.status === "pending" ? (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button
                              onClick={() => openPayModal(o)}
                              style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.15)", color: isLight ? "#065f46" : "#86efac", cursor: "pointer" }}
                            >
                              {t("customer.orders.pay")}
                            </button>
                            <button onClick={() => cancelOrder(o._id)} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.04)", color: muted, cursor: "pointer" }}>{t("customer.orders.cancel")}</button>
                          </div>
                        ) : o.status === "paid" ? (
                          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "#10b981" }}>{t("customer.orders.paidBadge")}</span>
                        ) : o.status === "awaiting_verification" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "#a5b4fc" }}>{t("customer.orders.awaiting")}</span>
                            {telegram ? (
                              <a
                                href={`https://t.me/${telegram}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "5px 9px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", textDecoration: "none" }}
                              >
                                {t("customer.orders.chatAdmin")}
                              </a>
                            ) : null}
                          </div>
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
        {t("customer.orders.footerNote")}
      </div>

      <style>{`@media(max-width: 860px){ .orders-plans{ grid-template-columns: 1fr !important; } }`}</style>

      {/* Payment modal */}
      {payTarget && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: 24,
          }}
          onClick={closePayModal}
          role="dialog"
          aria-modal="true"
          aria-label="Payment"
        >
          <div
            style={{
              width: "100%", maxWidth: 520, background: isLight ? "#fff" : "#0f0f19",
              borderRadius: 20, border: `1px solid ${border}`, overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {modalStep === "pay" ? (
              <>
                <div style={{ padding: "20px 24px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1, color: "#6366f1", marginBottom: 4 }}>{t("customer.orders.modalPayment")}</div>
                    <h3 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, color: fg }}>{t("customer.orders.modalPayFor", { plan: payTarget.plan_id?.name ?? "plan" })}</h3>
                  </div>
                  <button onClick={closePayModal} aria-label="Close" style={{ background: "none", border: "none", color: muted, cursor: "pointer", padding: 4 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>

                <div style={{ padding: "20px 24px", display: "grid", gap: 18 }}>
                  {/* order summary */}
                  <div style={{ display: "grid", gap: 8, fontFamily: "DM Mono, monospace", fontSize: 12.5 }}>
                    {[
                      [t("customer.orders.summaryPlan"), payTarget.plan_id?.name ?? "—"],
                      [t("customer.orders.summaryAmount"), money(payTarget.amount)],
                      [t("customer.orders.summaryCredits"), `${Number(payTarget.credits).toLocaleString()} credits`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px dashed ${border}`, paddingBottom: 6 }}>
                        <span style={{ color: subMuted }}>{k}</span>
                        <span style={{ color: fg, fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11.5, lineHeight: 1.5, color: "#a5b4fc", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10, padding: "10px 12px" }}>
                      {t("customer.orders.exactAmountNote")}
                    </div>

                  {/* payment method picker */}
                  <div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted, marginBottom: 10 }}>{t("customer.orders.payWith")}</div>
                    {paymentMethods.length === 0 ? (
                      <div style={{ padding: "14px 16px", borderRadius: 12, border: `1px dashed ${border}`, background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)", fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>
                        {t("customer.orders.noMethods")}
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 8, maxHeight: 220, overflowY: "auto" }} role="radiogroup" aria-label="Payment method">
                        {paymentMethods.map(m => {
                          const active = selectedMethod === m._id;
                          return (
                            <button
                              key={m._id}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setSelectedMethod(m._id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                                padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                                background: active ? (isLight ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.14)") : isLight ? "#fff" : "rgba(255,255,255,0.03)",
                                border: active ? "1px solid rgba(99,102,241,0.4)" : `1px solid ${border}`,
                              }}
                            >
                              {m.type === "qris" && m.image ? (
                                <img src={m.image} alt={m.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", background: "#fff" }} />
                              ) : (
                                <span style={{ width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 700, color: "#fff", background: m.type === "qris" ? "linear-gradient(135deg,#06b6d4,#6366f1)" : m.type === "bank" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(135deg,#10b981,#06b6d4)" }}>
                                  {m.type === "qris" ? "QR" : m.type === "bank" ? "BANK" : "E-WAL"}
                                </span>
                              )}
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: fg }}>{m.name}</span>
                                {m.account_holder || m.account_number ? (
                                  <span style={{ display: "block", fontFamily: "DM Mono, monospace", fontSize: 11.5, color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {[m.account_holder, m.account_number].filter(Boolean).join(" · ")}
                                  </span>
                                ) : null}
                              </span>
                              <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? "#6366f1" : border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                {active && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1" }} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* payment proof upload */}
                  <div>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted, marginBottom: 10 }}>{t("customer.orders.paymentProof")}</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => uploadEvidence(e.target.files?.[0])}
                      style={{ display: "none" }}
                      id={`evidence-${payTarget._id}`}
                    />
                    {evidenceUrl ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <img src={evidenceUrl} alt="payment proof" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", background: "#fff", border: `1px solid ${border}` }} />
                        <button
                          type="button"
                          onClick={() => (document.getElementById(`evidence-${payTarget._id}`) as HTMLInputElement)?.click()}
                          style={{ padding: "9px 14px", borderRadius: 10, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                        >
                          {t("customer.orders.replace")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvidenceUrl("")}
                          style={{ padding: "9px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                        >
                          {t("customer.orders.remove")}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => (document.getElementById(`evidence-${payTarget._id}`) as HTMLInputElement)?.click()}
                        disabled={evidenceUploading}
                        style={{ width: "100%", padding: "14px", borderRadius: 10, border: `1px dashed ${border}`, background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)", color: muted, cursor: evidenceUploading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500 }}
                      >
                        {evidenceUploading ? t("customer.orders.uploading") : t("customer.orders.uploadProof")}
                      </button>
                    )}
                  </div>

                  {err && <div role="alert" style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: isLight ? "#9f1239" : "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{err}</div>}

                  <button
                    onClick={() => confirmPay(payTarget._id)}
                    disabled={!!paying || !evidenceUrl}
                    style={{
                      padding: "13px 16px", borderRadius: 12, cursor: paying || !evidenceUrl ? "not-allowed" : "pointer",
                      background: paying ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)") : "linear-gradient(135deg,#10b981,#06b6d4)",
                      color: "#fff", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", fontSize: 14,
                      border: "1px solid rgba(16,185,129,0.35)", opacity: paying ? 0.6 : 1,
                    }}
                  >
                    {paying === payTarget._id ? t("customer.orders.submitting") : t("customer.orders.confirmPayment")}
                  </button>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, textAlign: "center", lineHeight: 1.6 }}>
                    {t("customer.orders.submitNote")}
                  </div>
                </div>
              </>
            ) : modalStep === "submitted" ? (
              <>
                <div style={{ padding: "32px 24px", textAlign: "center", display: "grid", gap: 14, justifyItems: "center" }}>
                  <span style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "grid", placeItems: "center", color: "#a5b4fc" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                  </span>
                  <h3 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 800, color: fg }}>{t("customer.orders.submittedTitle")}</h3>
                  <p style={{ margin: 0, color: muted, fontSize: 13.5, lineHeight: 1.6, maxWidth: 380 }}>
                    {t("customer.orders.submittedDesc", { plan: payTarget.plan_id?.name ?? "plan" })}
                  </p>
                  {telegram && (
                    <a
                      href={`https://t.me/${telegram}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ marginTop: 4, padding: "11px 22px", borderRadius: 12, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)", textDecoration: "none", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", fontSize: 14 }}
                    >
                      {t("customer.orders.chatAdmin")}
                    </a>
                  )}
                  {evidenceUrl && (
                    <img src={evidenceUrl} alt="payment proof" style={{ marginTop: 6, width: 120, height: 120, borderRadius: 12, objectFit: "cover", background: "#fff", border: `1px solid ${border}` }} />
                  )}
                  <button
                    onClick={closePayModal}
                    style={{ marginTop: 8, padding: "11px 28px", borderRadius: 12, background: isLight ? "#1c1917" : "rgba(255,255,255,0.08)", color: "#fff", border: `1px solid ${border}`, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", cursor: "pointer" }}
                  >
                    {t("customer.orders.done")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: "32px 24px", textAlign: "center", display: "grid", gap: 14, justifyItems: "center" }}>
                  <span style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "grid", placeItems: "center", color: "#10b981" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                  </span>
                    <h3 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 800, color: fg }}>{t("customer.orders.confirmedTitle")}</h3>
                    <p style={{ margin: 0, color: muted, fontSize: 13.5, lineHeight: 1.6, maxWidth: 380 }}>
                      {t("customer.orders.confirmedDesc", { plan: payTarget.plan_id?.name ?? "Plan" })}
                    </p>
                    {payResult?.credit_balance !== undefined && (
                      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 13, padding: "10px 16px", borderRadius: 12, border: `1px solid ${border}`, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)", color: fg }}>
                        {t("customer.orders.balance", { balance: Number(payResult.credit_balance).toLocaleString() })}
                      </div>
                    )}
                    {payResult?.referral && (
                      <div style={{ fontSize: 13, color: "#10b981", fontFamily: "DM Mono, monospace", padding: "10px 16px", borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                        {t("customer.orders.referral", { reward: payResult.referral.reward, code: payResult.referral.code, remaining: payResult.referral.remaining })}
                      </div>
                    )}
                  <button
                    onClick={closePayModal}
                    style={{ marginTop: 8, padding: "11px 28px", borderRadius: 12, background: isLight ? "#1c1917" : "rgba(255,255,255,0.08)", color: "#fff", border: `1px solid ${border}`, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", cursor: "pointer" }}
                  >
                    {t("customer.orders.done")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
