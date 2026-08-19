import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";

type CreditCustomer = { _id: string; customer_id: string; balance: number };
type CreditLog = { _id: string; credit_customer_id: string; credit_out: number; input_token: number; cached_token: number; output_token: number; createdAt: string };

export default function Usage() {
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [credit, setCredit] = useState<CreditCustomer | null>(null);
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardSoft = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const codeBg = isLight ? "#f5f5f4" : "#0f0f1a";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const subMuted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const faint = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setErr(""); setLoading(true);
        const meRes = await fetch("/api/router-customers/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!meRes.ok) throw new Error("Failed to load profile");
        const meData = await meRes.json();
        const u = meData.user ?? meData.router_customer;
        if (cancelled) return;
        setUserId(u.id);

        let cc: any = null;
        try {
          const ccRes = await fetch(`/api/credit-customers/by-customer/${u.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (ccRes.ok) cc = await ccRes.json();
        } catch { cc = null; }
        const ccDoc = cc?.credit_customer ?? cc;
        const normalized: CreditCustomer | null = ccDoc?._id ? ccDoc : ccDoc?.balance !== undefined ? ccDoc : null;
        if (cancelled) return;
        setCredit(normalized);

        if (normalized?._id) {
          const logsRes = await fetch(`/api/credit-logs?credit_customer_id=${normalized._id}&limit=20&page=${page}`);
          if (logsRes.ok) {
            const j = await logsRes.json();
            if (!cancelled) { setLogs(j.logs ?? []); setTotalLogs(j.total ?? 0); }
          }
        } else {
          setLogs([]); setTotalLogs(0);
        }
      } catch (e: any) { if (!cancelled) setErr(e.message || "Failed to load usage"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [token, page, userId]);

  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const totalUsed = logs.reduce((a, l) => a + (l.credit_out || 0), 0);
  const totalTokens = logs.reduce((a, l) => a + (l.input_token || 0) + (l.cached_token || 0) + (l.output_token || 0), 0);
  const totalPages = Math.max(1, Math.ceil(totalLogs / 20));
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); } catch {} };

  if (loading) return <div style={{ color: muted, fontFamily: "DM Mono, monospace", fontSize: 13 }}>Loading usage…</div>;

  return (
    <div style={{ display: "grid", gap: 16, color: fg }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, color: fg }}>Usage</h2>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, border: `1px solid ${border}`, padding: "5px 10px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>baseURL → router.alvineitsolutions.com · model: auto</span>
        <button onClick={() => token && copy(token)} style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 11, padding: "7px 11px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>Copy token</button>
      </div>

      {err && <div role="alert" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: isLight ? "#9f1239" : "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 13 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }} className="usage-stats">
        <div style={{ borderRadius: 16, padding: 18, background: isLight ? "#fff" : "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(139,92,246,0.06))", border: `1px solid ${isLight ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.22)"}`, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
          <div style={{ fontSize: 11, color: muted, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>CREDIT BALANCE</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6, fontFamily: "Space Grotesk, sans-serif", marginTop: 6, color: fg }}>{credit?.balance?.toLocaleString?.() ?? "0"}</div>
          <div style={{ fontSize: 11, color: subMuted, fontFamily: "DM Mono, monospace", marginTop: 4 }}>available credits</div>
        </div>
        <div style={{ borderRadius: 16, padding: 18, background: isLight ? "#fff" : "linear-gradient(135deg, rgba(6,182,214,0.14), rgba(6,182,214,0.04))", border: `1px solid ${isLight ? "rgba(6,182,214,0.18)" : "rgba(6,182,214,0.22)"}`, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
          <div style={{ fontSize: 11, color: muted, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>CREDITS USED (page)</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", marginTop: 6, color: fg }}>{totalUsed.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: subMuted, fontFamily: "DM Mono, monospace", marginTop: 4 }}>{totalLogs} total requests</div>
        </div>
        <div style={{ borderRadius: 16, padding: 18, background: isLight ? "#fff" : "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.04))", border: `1px solid ${isLight ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.22)"}`, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
          <div style={{ fontSize: 11, color: muted, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>TOKENS (page)</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", marginTop: 6, color: fg }}>{totalTokens.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: subMuted, fontFamily: "DM Mono, monospace", marginTop: 4 }}>input + cached + output</div>
        </div>
      </div>

      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardSoft, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}`, gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: fg }}>Recent usage</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>
            <span>Page {page} / {totalPages}</span>
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: page <= 1 ? "transparent" : isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}>Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: page >= totalPages ? "transparent" : isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1 }}>Next</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: subMuted, borderBottom: `1px solid ${faint}` }}>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>DATE</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>CREDIT OUT</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>INPUT</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>CACHED</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>OUTPUT</th>
                <th style={{ padding: "10px 14px", fontWeight: 500 }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 13 }}>No usage yet — make your first request and it will appear here.</td></tr>
              ) : logs.map(l => (
                <tr key={l._id} style={{ borderBottom: `1px solid ${faint}` }}>
                  <td style={{ padding: "11px 14px", color: muted, whiteSpace: "nowrap" }}>{fmtDate(l.createdAt)}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: fg }}>{Number(l.credit_out).toLocaleString()}</td>
                  <td style={{ padding: "11px 14px", color: muted }}>{Number(l.input_token).toLocaleString()}</td>
                  <td style={{ padding: "11px 14px", color: muted }}>{Number(l.cached_token).toLocaleString()}</td>
                  <td style={{ padding: "11px 14px", color: muted }}>{Number(l.output_token).toLocaleString()}</td>
                  <td style={{ padding: "11px 14px", color: muted, fontFamily: "DM Mono, monospace" }}>{(Number(l.input_token) + Number(l.cached_token) + Number(l.output_token)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.03)", padding: 14, boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted, marginBottom: 10 }}>QUICK START — cURL</div>
        <pre style={{ margin: 0, padding: 12, borderRadius: 12, background: codeBg, border: `1px solid ${faint}`, overflowX: "auto", fontFamily: "DM Mono, monospace", fontSize: 12, lineHeight: 1.6, color: isLight ? "#1c1917" : "#e0e7ff" }}>
{`curl https://router.alvineitsolutions.com/v1/chat/completions \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`}
        </pre>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button onClick={() => copy(`curl https://router.alvineitsolutions.com/v1/chat/completions -H "Authorization: Bearer ${token ?? ""}" -H "Content-Type: application/json" -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`)} style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>Copy snippet</button>
          <Link to="/dashboard/docs" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.15)", color: "#6366f1", textDecoration: "none" }}>Docs →</Link>
        </div>
      </div>
      <style>{`@media(max-width: 860px){ .usage-stats{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
