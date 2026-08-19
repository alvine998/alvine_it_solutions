import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCustomer } from "../../components/CustomerLayout";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";

type CreditCustomer = { _id: string; customer_id: string; balance: number };
type CreditLog = { _id: string; credit_customer_id: string; credit_out: number; input_token: number; cached_token: number; output_token: number; createdAt: string };

export default function Dashboard() {
  const { user, token } = useCustomer();
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const [credit, setCredit] = useState<CreditCustomer | null>(null);
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.03)";
  const cardBgSoft = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const codeBg = isLight ? "#f5f5f4" : "#0f0f1a";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const subMuted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const faintBorder = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  useEffect(() => {
    if (!user?.id || !token) return;
    let cancelled = false;
    (async () => {
      try {
        setErr("");
        let cc: any = null;
        try {
          const ccRes = await fetch(`/api/credit-customers/by-customer/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (ccRes.ok) cc = await ccRes.json();
        } catch { cc = null; }
        const ccDoc = cc?.credit_customer ?? cc;
        const normalized: CreditCustomer | null = ccDoc?._id ? ccDoc : ccDoc?.balance !== undefined ? ccDoc : null;
        if (cancelled) return;
        setCredit(normalized);
        if (normalized?._id) {
          const logsRes = await fetch(`/api/credit-logs?credit_customer_id=${normalized._id}&limit=5&page=1`);
          if (logsRes.ok) {
            const j = await logsRes.json();
            if (!cancelled) { setLogs(j.logs ?? []); setTotalLogs(j.total ?? 0); }
          }
        } else { setLogs([]); setTotalLogs(0); }
      } catch (e: any) { if (!cancelled) setErr(e.message || "Failed to load dashboard"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user?.id, token]);

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); } catch {} };
  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const totalUsed = logs.reduce((a, l) => a + (l.credit_out || 0), 0);
  const totalTokens = logs.reduce((a, l) => a + (l.input_token || 0) + (l.cached_token || 0) + (l.output_token || 0), 0);
  const selectedPlan = typeof window !== "undefined" ? localStorage.getItem("selectedPlan") : null;

  if (loading) return <div style={{ color: muted, fontFamily: "DM Mono, monospace", fontSize: 13 }}>Loading dashboard…</div>;

  return (
    <div style={{ display: "grid", gap: 16, color: fg }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 0.85fr", gap: 14 }} className="dash-hero">
        <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: isLight ? "linear-gradient(180deg, rgba(99,102,241,0.08), #fff)" : "linear-gradient(180deg, rgba(99,102,241,0.12), rgba(255,255,255,0.02))", padding: 18, overflow: "hidden" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1.2, color: isLight ? "#6366f1" : "#06b6d4", marginBottom: 8 }}>AI ROUTER — DASHBOARD</div>
          <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1, color: fg }}>
            Welcome back, <span style={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{user?.name ?? "—"}</span>
          </h2>
          <p style={{ margin: "8px 0 0", color: muted, fontSize: 13.5, lineHeight: 1.6 }}>
            Monitor credits, usage and API access for <span style={{ color: fg, fontWeight: 600 }}>{user?.email ?? "—"}</span>
            {selectedPlan ? <span style={{ marginLeft: 8, fontFamily: "DM Mono, monospace", fontSize: 11, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", padding: "3px 8px", borderRadius: 20, color: "#6366f1" }}>{selectedPlan.toUpperCase()}</span> : null}
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", fontFamily: "DM Mono, monospace", fontSize: 11, color: muted }}>
            <span style={{ border: `1px solid ${border}`, padding: "6px 10px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>status: <span style={{ color: user?.status === "active" ? "#10b981" : "#f59e0b", fontWeight: 700 }}>{user?.status ?? "—"}</span></span>
            <span style={{ border: `1px solid ${border}`, padding: "6px 10px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>model: auto</span>
            <span style={{ border: `1px solid ${border}`, padding: "6px 10px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>baseURL: router.alvineitsolutions.com</span>
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link to="/dashboard/chat" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "8px 12px", borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#06b6d4)", color: "#fff", textDecoration: "none", fontWeight: 700 }}>Open Chat →</Link>
            <Link to="/dashboard/usage" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, textDecoration: "none" }}>View usage →</Link>
          </div>
        </div>

        <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBg, padding: 14, display: "grid", gap: 10, alignContent: "start", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted }}>API ACCESS</div>
          <div style={{ background: codeBg, border: `1px solid ${faintBorder}`, borderRadius: 12, padding: 12 }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, marginBottom: 6 }}>ENDPOINT</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <code style={{ flex: 1, fontFamily: "DM Mono, monospace", fontSize: 12, color: isLight ? "#1c1917" : "#e0e7ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>https://router.alvineitsolutions.com/v1/chat/completions</code>
              <button onClick={() => copy("https://router.alvineitsolutions.com/v1/chat/completions")} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer", whiteSpace: "nowrap" }}>Copy</button>
            </div>
            <div style={{ marginTop: 10, fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted }}>Auth: <span style={{ color: muted }}>Authorization: Bearer &lt;token&gt;</span></div>
            <button onClick={() => token && copy(token)} style={{ marginTop: 8, fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.15)", color: "#6366f1", cursor: "pointer" }}>Copy token</button>
          </div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, lineHeight: 1.6, color: subMuted }}>Swap OpenAI baseURL only — keep your SDK. Billing per 1k tokens via credits.</div>
        </div>
      </div>

      {err && <div role="alert" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: isLight ? "#9f1239" : "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 13 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }} className="dash-stats">
        <div style={{ borderRadius: 16, padding: 18, background: isLight ? "#fff" : "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(139,92,246,0.06))", border: `1px solid ${isLight ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.22)"}`, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
          <div style={{ fontSize: 11, color: muted, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>CREDIT BALANCE</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6, fontFamily: "Space Grotesk, sans-serif", marginTop: 6, color: fg }}>{credit?.balance?.toLocaleString?.() ?? "0"}</div>
          <div style={{ fontSize: 11, color: subMuted, fontFamily: "DM Mono, monospace", marginTop: 4 }}>available credits</div>
        </div>
        <div style={{ borderRadius: 16, padding: 18, background: isLight ? "#fff" : "linear-gradient(135deg, rgba(6,182,214,0.14), rgba(6,182,214,0.04))", border: `1px solid ${isLight ? "rgba(6,182,214,0.18)" : "rgba(6,182,214,0.22)"}`, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
          <div style={{ fontSize: 11, color: muted, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>CREDITS USED (sample)</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", marginTop: 6, color: fg }}>{totalUsed.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: subMuted, fontFamily: "DM Mono, monospace", marginTop: 4 }}>{totalLogs} total requests</div>
        </div>
        <div style={{ borderRadius: 16, padding: 18, background: isLight ? "#fff" : "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.04))", border: `1px solid ${isLight ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.22)"}`, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
          <div style={{ fontSize: 11, color: muted, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>TOKENS (sample)</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", marginTop: 6, color: fg }}>{totalTokens.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: subMuted, fontFamily: "DM Mono, monospace", marginTop: 4 }}>input + cached + output</div>
        </div>
      </div>

      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBgSoft, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}` }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: fg }}>Recent usage</h3>
          <Link to="/dashboard/usage" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#6366f1", textDecoration: "none" }}>View all →</Link>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: subMuted, borderBottom: `1px solid ${faintBorder}` }}>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>DATE</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>CREDIT OUT</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>TOKENS</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 24, textAlign: "center", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>No usage yet — make your first request.</td></tr>
              ) : logs.map(l => (
                <tr key={l._id} style={{ borderBottom: `1px solid ${faintBorder}` }}>
                  <td style={{ padding: "11px 14px", color: muted, whiteSpace: "nowrap" }}>{fmtDate(l.createdAt)}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: fg }}>{Number(l.credit_out).toLocaleString()}</td>
                  <td style={{ padding: "11px 14px", color: muted, fontFamily: "DM Mono, monospace" }}>{(Number(l.input_token) + Number(l.cached_token) + Number(l.output_token)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@media(max-width: 860px){ .dash-hero{ grid-template-columns: 1fr !important; } .dash-stats{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
