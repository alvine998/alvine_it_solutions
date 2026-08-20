import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";

const Chart = lazy(() => import("react-apexcharts"));

interface Contact { _id: string; name: string; email: string; phone?: string; company?: string; message: string; createdAt: string; }
interface Invoice { _id: string; number: string; billTo: string; total?: number; paymentStage: string; createdAt: string; items?: { qty: number; rate: number }[]; taxPercent?: number; discount?: number; }
interface OrderRow { _id: string; customer_id: { name?: string; email?: string } | null; plan_id: { name?: string } | null; amount: number; status: string; createdAt: string; }
interface Customer { _id: string; name: string; email: string; status: string; }

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderRow[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [paidOrders, setPaidOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleAuthFail = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  }, [navigate]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { navigate("/admin/login"); return; }
    setLoading(true);
    setError("");
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [cRes, iRes, oRes, pRes, cuRes] = await Promise.allSettled([
        fetch("/api/contact", { headers: h }),
        fetch("/api/invoices", { headers: h }),
        fetch("/api/orders?status=awaiting_verification&limit=5", { headers: h }),
        fetch("/api/orders?status=paid&limit=100", { headers: h }),
        fetch("/api/customers", { headers: h }),
      ]);

      if (cRes.status === "fulfilled" && cRes.value.status === 401) return handleAuthFail();
      if (iRes.status === "fulfilled" && iRes.value.status === 401) return handleAuthFail();

      if (cRes.status === "fulfilled" && cRes.value.ok) setContacts(await cRes.value.json());
      if (iRes.status === "fulfilled" && iRes.value.ok) setInvoices(await iRes.value.json());
      if (oRes.status === "fulfilled" && oRes.value.ok) {
        const d = await oRes.value.json();
        setPendingOrders(d.orders ?? []);
        setPendingTotal(d.total ?? d.orders?.length ?? 0);
      }
      if (pRes.status === "fulfilled" && pRes.value.ok) {
        const d = await pRes.value.json();
        setPaidOrders(d.orders ?? []);
      }
      if (cuRes.status === "fulfilled" && cuRes.value.ok) {
        const d = await cuRes.value.json();
        setCustomers(Array.isArray(d) ? d : d.customers ?? []);
      }
      const failed = [cRes, iRes, oRes, pRes, cuRes].filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok && r.value.status !== 401)).length;
      if (failed >= 3) setError("Some data failed to load. Check server connection.");
    } catch (e) {
      console.error(e);
      setError("Failed to load dashboard. Try again.");
    } finally { setLoading(false); }
  }, [navigate, handleAuthFail]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const formatCurrency = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  const formatCompact = (n: number) => new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  const invTotal = (inv: Invoice) => {
    if (typeof inv.total === "number" && Number.isFinite(inv.total)) return inv.total;
    const sub = (inv.items ?? []).reduce((s, it) => s + (it.qty ?? 0) * (it.rate ?? 0), 0);
    return Math.max(sub * (1 + (inv.taxPercent ?? 0) / 100) - (inv.discount ?? 0), 0);
  };
  const revenue = invoices.reduce((s, inv) => s + invTotal(inv), 0);

  const aiRevenue = useMemo(() => paidOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0), [paidOrders]);
  const aiCount = paidOrders.length;
  const planGroups = useMemo(() => {
    const m = new Map<string, { sum: number; count: number }>();
    for (const o of paidOrders) {
      const k = o.plan_id?.name || "Unknown";
      const cur = m.get(k) ?? { sum: 0, count: 0 };
      cur.sum += Number(o.amount) || 0;
      cur.count += 1;
      m.set(k, cur);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].sum - a[1].sum);
  }, [paidOrders]);
  const daily = useMemo(() => {
    const DAYS = 14;
    const buckets: { label: string; key: string; val: number }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      buckets.push({ label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), key: d.toISOString().slice(0, 10), val: 0 });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    for (const o of paidOrders) {
      const k = new Date(o.createdAt).toISOString().slice(0, 10);
      const b = map.get(k);
      if (b) b.val += Number(o.amount) || 0;
    }
    return buckets;
  }, [paidOrders]);

  const hasAiData = aiCount > 0;

  const areaOpts: any = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "DM Mono, monospace", background: "transparent" },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5, colors: ["#06b6d4"] },
    fill: { type: "gradient", gradient: { shadeIntensity: 0.3, opacityFrom: 0.35, opacityTo: 0.02, colorStops: [{ offset: 0, color: "#06b6d4", opacity: 0.35 }, { offset: 100, color: "#06b6d4", opacity: 0.02 }] } },
    colors: ["#06b6d4"],
    grid: { borderColor: "rgba(255,255,255,0.06)", strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { left: 8, right: 12 } },
    xaxis: { categories: daily.map((d) => d.label), labels: { style: { colors: "rgba(255,255,255,0.45)", fontSize: "11px", fontFamily: "DM Mono, monospace" } }, axisBorder: { color: "rgba(255,255,255,0.06)" }, axisTicks: { color: "rgba(255,255,255,0.06)" } },
    yaxis: { labels: { style: { colors: "rgba(255,255,255,0.45)", fontSize: "11px" }, formatter: (v: number) => `IDR ${formatCompact(Math.round(v))}` }, min: 0 },
    tooltip: { theme: "dark", y: { formatter: (v: number) => formatCurrency(Math.round(v)) } },
    markers: { size: 0, hover: { size: 5 } },
  };
  const donutOpts: any = {
    chart: { type: "donut", fontFamily: "DM Mono, monospace", background: "transparent" },
    labels: planGroups.map(([k]) => k),
    colors: ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"],
    dataLabels: { enabled: false },
    legend: { position: "bottom", fontSize: "12px", fontFamily: "DM Mono, monospace", labels: { colors: "rgba(255,255,255,0.65)" } },
    stroke: { show: false },
    tooltip: { theme: "dark", y: { formatter: (v: number) => formatCurrency(Math.round(v)) } },
    plotOptions: { pie: { donut: { size: "62%", labels: { show: true, total: { show: true, label: "Revenue", color: "rgba(255,255,255,0.5)", formatter: () => formatCompact(aiRevenue) } } } } },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 108, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>Loading dashboard…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "Space Grotesk,sans-serif" }}>Overview</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{pendingTotal > 0 ? `${pendingTotal} payment${pendingTotal > 1 ? "s" : ""} awaiting verification` : "All caught up"} · {aiCount} AI Router sales · {formatCurrency(aiRevenue)} router revenue</p>
        </div>
        <button onClick={fetchData} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>↻ Refresh</button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span>{error}</span><button onClick={fetchData} style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>Retry</button>
        </div>
      )}

      {pendingTotal > 0 && (
        <div onClick={() => navigate("/admin/orders?status=awaiting_verification")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && navigate("/admin/orders")}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderRadius: 12, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 20, cursor: "pointer", flexWrap: "wrap", gap: 12 }}>
          <span style={{ color: "#f59e0b", fontSize: 14, fontWeight: 600 }}>⚠ {pendingTotal} order{pendingTotal > 1 ? "s" : ""} need verification — review payment proof</span>
          <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: 700 }}>Review →</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginBottom: 24 }}>
        <div style={{ padding: 24, borderRadius: 16, background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.05))", border: "1px solid rgba(99,102,241,0.2)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Total Contacts</p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#fff" }}>{contacts.length}</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{contacts.length ? `Latest ${formatDate(contacts[0].createdAt)}` : "No data"}</p>
        </div>
        <div style={{ padding: 24, borderRadius: 16, background: "linear-gradient(135deg,rgba(6,182,212,0.15),rgba(6,182,212,0.05))", border: "1px solid rgba(6,182,212,0.2)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Customers</p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#fff" }}>{customers.length}</p>
          <button onClick={() => navigate("/admin/customers")} style={{ marginTop: 8, padding: 0, background: "none", border: "none", color: "#22d3ee", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Manage →</button>
        </div>
        <div style={{ padding: 24, borderRadius: 16, background: pendingTotal ? "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.06))" : "linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))", border: `1px solid ${pendingTotal ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.2)"}` }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Awaiting Verification</p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: pendingTotal ? "#f59e0b" : "#fff" }}>{pendingTotal}</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{pendingTotal ? "Needs action" : "All verified"}</p>
        </div>
        <div style={{ padding: 24, borderRadius: 16, background: "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.04))", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>AI Router Revenue (paid)</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", wordBreak: "break-all" }}>{formatCurrency(aiRevenue)}</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{aiCount} order{aiCount !== 1 ? "s" : ""} · {planGroups.length} plan{planGroups.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ padding: 24, borderRadius: 16, background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Revenue (invoices)</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", wordBreak: "break-all" }}>{formatCurrency(revenue)}</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20, marginBottom: 24 }} className="ai-charts">
        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Space Grotesk,sans-serif" }}>AI Router Revenue — last 14 days</h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "DM Mono, monospace" }}>{hasAiData ? `${formatCurrency(aiRevenue)} total · ${aiCount} paid` : "No paid orders yet"}</p>
            </div>
            <button onClick={() => navigate("/admin/orders?status=paid")} style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(6,182,212,0.15)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>View orders</button>
          </div>
          <div style={{ padding: "8px 8px 4px" }}>
            {!hasAiData ? (
              <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No revenue data yet — paid orders will appear here</div>
            ) : (
              <Suspense fallback={<div style={{ height: 260, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading chart…</div>}>
                <Chart options={areaOpts} series={[{ name: "Revenue", data: daily.map((d) => d.val) }]} type="area" height={260} />
              </Suspense>
            )}
          </div>
        </div>

        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "Space Grotesk,sans-serif" }}>Revenue by Plan</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "DM Mono, monospace" }}>{hasAiData ? `${planGroups.length} plan(s)` : "No data"}</p>
          </div>
          <div style={{ padding: 12 }}>
            {!hasAiData ? (
              <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No plan breakdown yet</div>
            ) : (
              <>
                <Suspense fallback={<div style={{ height: 220, display: "grid", placeItems: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading chart…</div>}>
                  <Chart options={donutOpts} series={planGroups.map(([, v]) => v.sum)} type="donut" height={240} />
                </Suspense>
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  {planGroups.map(([name, v]) => (
                    <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{name}</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "DM Mono, monospace" }}>{v.count}× · {formatCurrency(v.sum)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 24 }}>
        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff" }}>Recent Contacts</h2>
            <button onClick={() => navigate("/admin/contacts")} style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>View All</button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {contacts.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 40, fontSize: 14 }}>No contacts yet</p> : contacts.slice(0, 5).map((c) => (
              <div key={c._id} style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p><p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</p></div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{formatDate(c.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff" }}>Pending Payments</h2>
            <button onClick={() => navigate("/admin/orders")} style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>View All</button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {pendingOrders.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 40, fontSize: 14 }}>{pendingTotal === 0 ? "No pending payments" : "No pending in this page"}</p> : pendingOrders.map((o) => (
              <div key={o._id} style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer_id?.name || o.customer_id?.email || "Customer"} · {o.plan_id?.name || "Plan"}</p><p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>IDR {Number(o.amount).toLocaleString("id-ID")}</p></div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{formatDate(o.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff" }}>Recent Invoices</h2>
            <button onClick={() => navigate("/admin/invoices")} style={{ padding: "6px 14px", borderRadius: 6, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>View All</button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {invoices.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 40, fontSize: 14 }}>No invoices yet</p> : invoices.slice(0, 5).map((inv) => (
              <div key={inv._id} style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{inv.number}</p><p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.billTo}</p></div>
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}><p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{formatCurrency(invTotal(inv))}</p><span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, background: inv.paymentStage === "full" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: inv.paymentStage === "full" ? "#10b981" : "#f59e0b", fontSize: 11, fontWeight: 600, marginTop: 4 }}>{inv.paymentStage.toUpperCase()}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width: 900px){ .ai-charts{ grid-template-columns: 1fr !important; } }`}</style>
    </AdminLayout>
  );
}
