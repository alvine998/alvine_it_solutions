import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FALLBACK_ROUTER_BASE, fetchActiveRouterBase } from "../lib/routerBaseUrl";
import { toast } from "../lib/toast";

type MeUser = { id: string; name: string; email: string; status: string };
type CreditCustomer = { _id: string; customer_id: string; balance: number };
type CreditLog = {
  _id: string;
  credit_customer_id: string;
  credit_out: number;
  input_token: number;
  cached_token: number;
  output_token: number;
  createdAt: string;
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<MeUser | null>(null);
  const [credit, setCredit] = useState<CreditCustomer | null>(null);
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [routerBase, setRouterBase] = useState(FALLBACK_ROUTER_BASE);
  useEffect(() => { fetchActiveRouterBase().then(b => { if (b) setRouterBase(b); }); }, []);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) { navigate("/auth?mode=login"); return; }
    let cancelled = false;
    (async () => {
      try {
        setErr("");
        const meRes = await fetch("/api/router-customers/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!meRes.ok) throw new Error(meRes.status === 401 ? "Session expired. Please sign in again." : "Failed to load profile");
        const meData = await meRes.json();
        const u: MeUser = meData.user ?? meData.router_customer;
        if (cancelled) return;
        setUser(u);

        // credit balance — 404 means zero
        let cc: CreditCustomer | null = null;
        try {
          const ccRes = await fetch(`/api/credit-customers/by-customer/${u.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (ccRes.ok) cc = await ccRes.json();
          else if (ccRes.status !== 404) throw new Error("Failed to load balance");
          else cc = null;
        } catch { cc = null; }
        if (cancelled) return;
        // unwrap populated shape: some APIs return doc directly, some wrapped
        const ccDoc = (cc as any)?.credit_customer ?? cc;
        const normalized: CreditCustomer | null = ccDoc?._id ? ccDoc : ccDoc?.balance !== undefined ? ccDoc : null;
        setCredit(normalized);

        if (normalized?._id) {
          const logsRes = await fetch(`/api/credit-logs?credit_customer_id=${normalized._id}&limit=20&page=${page}`);
          if (logsRes.ok) {
            const j = await logsRes.json();
            setLogs(j.logs ?? []);
            setTotalLogs(j.total ?? 0);
          }
        } else {
          setLogs([]);
          setTotalLogs(0);
        }
      } catch (e: any) {
        if (!cancelled) {
          const msg = e.message || "Failed to load dashboard";
          setErr(msg);
          if (/expired|Invalid token|No token/i.test(msg)) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("router_customer");
            navigate("/auth?mode=login");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, navigate, page]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("router_customer");
    localStorage.removeItem("selectedPlan");
    navigate("/auth?mode=login");
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast("Copied"); } catch { toast("Copy failed"); }
  };

  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const totalUsed = logs.reduce((a, l) => a + (l.credit_out || 0), 0);
  const totalTokens = logs.reduce((a, l) => a + (l.input_token || 0) + (l.cached_token || 0) + (l.output_token || 0), 0);
  const totalPages = Math.max(1, Math.ceil(totalLogs / 20));
  const selectedPlan = (typeof window !== "undefined" ? localStorage.getItem("selectedPlan") : null) as string | null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.6)", fontFamily: "Inter, sans-serif" }}>
        Loading dashboard…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a14", fontFamily: "Inter, sans-serif", color: "#fff" }}>
      {/* hairline top bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(10,10,20,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "grid", placeItems: "center", fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 700, color: "#fff" }}>A</span>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: -0.2, color: "#fff" }}>ALVINE IT SOLUTIONS</span>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1, color: "rgba(255,255,255,0.45)", borderLeft: "1px solid rgba(255,255,255,0.12)", paddingLeft: 10, marginLeft: 2 }}>CUSTOMER</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link to="/" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(255,255,255,0.6)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", padding: "7px 12px", borderRadius: 20 }}>View site</Link>
            <button onClick={handleLogout} style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#fecaca", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", padding: "7px 12px", borderRadius: 20, cursor: "pointer" }}>Sign out</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 24px 40px", display: "grid", gap: 20 }}>
        {/* welcome + profile */}
        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.85fr", gap: 16 }} className="dash-hero">
          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(180deg, rgba(99,102,241,0.12), rgba(255,255,255,0.02))", padding: 20, overflow: "hidden", position: "relative" }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1.2, color: "#06b6d4", marginBottom: 8 }}>AI ROUTER — DASHBOARD</div>
            <h1 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1 }}>
              Welcome back, <span style={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{user?.name ?? "—"}</span>
            </h1>
            <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.58)", fontSize: 13.5, lineHeight: 1.6 }}>
              Monitor credits, usage and API access for <span style={{ color: "#fff" }}>{user?.email ?? "—"}</span>
              {selectedPlan ? <span style={{ marginLeft: 8, fontFamily: "DM Mono, monospace", fontSize: 11, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", padding: "3px 8px", borderRadius: 20, color: "#a5b4fc" }}>{selectedPlan.toUpperCase()}</span> : null}
            </p>
            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              <span style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "6px 10px", borderRadius: 20, background: "rgba(255,255,255,0.03)" }}>status: <span style={{ color: user?.status === "active" ? "#10b981" : "#f59e0b" }}>{user?.status ?? "—"}</span></span>
              <span style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "6px 10px", borderRadius: 20, background: "rgba(255,255,255,0.03)" }}>model: auto</span>
              <span title={routerBase} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "6px 10px", borderRadius: 20, background: "rgba(255,255,255,0.03)" }}>baseURL: {routerBase.replace(/^https?:\/\//, "")}</span>
            </div>
          </div>

          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", padding: 16, display: "grid", gap: 12 }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: "rgba(255,255,255,0.45)" }}>API ACCESS</div>
            <div style={{ background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>ENDPOINT</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <code style={{ flex: 1, fontFamily: "DM Mono, monospace", fontSize: 12, color: "#e0e7ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{routerBase}/chat/completions</code>
                <button onClick={() => copy(`${routerBase}/chat/completions`)} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>Copy</button>
              </div>
              <div style={{ marginTop: 10, fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Auth: <span style={{ color: "rgba(255,255,255,0.7)" }}>Authorization: Bearer &lt;token&gt;</span></div>
              <button onClick={() => token && copy(token)} style={{ marginTop: 8, fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", cursor: "pointer" }}>Copy token</button>
            </div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>
              Swap OpenAI baseURL only — keep your SDK. Billing per 1k tokens via credits.
            </div>
          </div>
        </div>

        {err && <div role="alert" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 13 }}>{err}</div>}

        {/* stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="dash-stats">
          <div style={{ borderRadius: 16, padding: 18, background: "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(139,92,246,0.06))", border: "1px solid rgba(99,102,241,0.22)" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>CREDIT BALANCE</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, fontFamily: "Space Grotesk, sans-serif" }}>{credit?.balance?.toLocaleString?.() ?? "0"}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4, fontFamily: "DM Mono, monospace" }}>available credits</div>
          </div>
          <div style={{ borderRadius: 16, padding: 18, background: "linear-gradient(135deg, rgba(6,182,214,0.14), rgba(6,182,214,0.04))", border: "1px solid rgba(6,182,214,0.22)" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>CREDITS USED (page)</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, fontFamily: "Space Grotesk, sans-serif" }}>{totalUsed.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4, fontFamily: "DM Mono, monospace" }}>{totalLogs} total requests</div>
          </div>
          <div style={{ borderRadius: 16, padding: 18, background: "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.04))", border: "1px solid rgba(16,185,129,0.22)" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>TOKENS (page)</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, fontFamily: "Space Grotesk, sans-serif" }}>{totalTokens.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4, fontFamily: "DM Mono, monospace" }}>input + cached + output</div>
          </div>
        </div>

        {/* usage table */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif" }}>Recent usage</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              <span>Page {page} / {totalPages}</span>
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: page <= 1 ? "transparent" : "rgba(255,255,255,0.06)", color: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}>Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: page >= totalPages ? "transparent" : "rgba(255,255,255,0.06)", color: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1 }}>Next</button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: "rgba(255,255,255,0.45)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>DATE</th>
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>CREDIT OUT</th>
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>INPUT</th>
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>CACHED</th>
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>OUTPUT</th>
                  <th style={{ padding: "10px 16px", fontWeight: 500 }}>TOTAL TOKENS</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: "rgba(255,255,255,0.45)", fontFamily: "DM Mono, monospace", fontSize: 13 }}>No usage yet — make your first request and it will appear here.</td></tr>
                ) : logs.map(l => (
                  <tr key={l._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap" }}>{fmtDate(l.createdAt)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#fff" }}>{Number(l.credit_out).toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)" }}>{Number(l.input_token).toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)" }}>{Number(l.cached_token).toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.7)" }}>{Number(l.output_token).toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.6)", fontFamily: "DM Mono, monospace" }}>{(Number(l.input_token)+Number(l.cached_token)+Number(l.output_token)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* quick start */}
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", padding: 16 }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>QUICK START — cURL</div>
          <pre style={{ margin: 0, padding: 14, borderRadius: 12, background: "#0f0f1a", border: "1px solid rgba(255,255,255,0.08)", overflowX: "auto", fontFamily: "DM Mono, monospace", fontSize: 12.5, lineHeight: 1.6, color: "#e0e7ff" }}>
{`curl ${routerBase}/chat/completions \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`}
          </pre>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button onClick={() => copy(`curl ${routerBase}/chat/completions -H "Authorization: Bearer ${token ?? ""}" -H "Content-Type: application/json" -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`)} style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer" }}>Copy snippet</button>
            <Link to="/#pricing" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.15)", color: "#a5b4fc", textDecoration: "none" }}>Manage plan →</Link>
          </div>
        </div>
      </main>

      <style>{`
        @media(max-width: 860px){
          .dash-hero{ grid-template-columns: 1fr !important; }
          .dash-stats{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
