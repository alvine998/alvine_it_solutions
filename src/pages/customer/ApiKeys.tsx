import { useEffect, useState } from "react";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";
import { toast } from "../../lib/toast";

type ApiKeyRow = { _id: string; name: string; prefix: string; last4: string; status: "active" | "revoked"; last_used_at?: string; createdAt: string; updatedAt: string };

export default function ApiKeys() {
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<{ raw: string; row: ApiKeyRow } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const inputBg = isLight ? "#fff" : "#0f0f1a";

  const fetchRows = async () => {
    if (!token) return;
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("/api/customer-api-keys", { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Failed (${r.status})`);
      setRows(j.api_keys ?? []);
    } catch (e: any) { setErr(e.message || "Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchRows(); }, []);

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast("API key copied"); } catch { toast("Copy failed"); } };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) { setErr("Name required"); return; }
    setErr(""); setCreating(true);
    try {
      const r = await fetch("/api/customer-api-keys", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: n }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Create failed (${r.status})`);
      setRevealed({ raw: j.key as string, row: j.api_key as ApiKeyRow });
      setName("");
      fetchRows();
    } catch (e: any) { setErr(e.message || "Create failed"); }
    finally { setCreating(false); }
  };

  const saveEdit = async (id: string) => {
    const n = editName.trim();
    if (!n) { setErr("Name required"); return; }
    setErr("");
    try {
      const r = await fetch(`/api/customer-api-keys/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: n }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Update failed (${r.status})`);
      setEditingId(null);
      fetchRows();
    } catch (e: any) { setErr(e.message || "Update failed"); }
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this key? Existing integrations using it will stop working.")) return;
    setErr("");
    try {
      const r = await fetch(`/api/customer-api-keys/${id}/revoke`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Revoke failed (${r.status})`);
      fetchRows();
    } catch (e: any) { setErr(e.message || "Revoke failed"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this key permanently?")) return;
    setErr("");
    try {
      const r = await fetch(`/api/customer-api-keys/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Delete failed (${r.status})`);
      fetchRows();
    } catch (e: any) { setErr(e.message || "Delete failed"); }
  };

  return (
    <div style={{ display: "grid", gap: 16, color: fg }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, color: fg }}>API Keys</h2>
        <p style={{ margin: "6px 0 0", fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>Keys have prefix <code style={{ color: fg }}>sk-</code>. Use <code style={{ color: fg }}>X-Api-Key: sk-...</code> or <code style={{ color: fg }}>Authorization: Bearer sk-...</code> for <code style={{ color: fg }}>/chat/completions</code>. Raw key shown once on create.</p>
      </div>

      {revealed && (
        <div style={{ padding: 14, borderRadius: 14, border: "1px solid rgba(16,185,129,0.28)", background: isLight ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.12)", display: "grid", gap: 10 }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: "#10b981", fontWeight: 700 }}>NEW KEY — COPY NOW (won't be shown again)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ flex: 1, minWidth: 220, padding: "10px 12px", borderRadius: 10, background: isLight ? "#fff" : "#0f0f1a", border: `1px solid ${border}`, color: fg, fontFamily: "DM Mono, monospace", fontSize: 12, wordBreak: "break-all" }}>{revealed.raw}</code>
            <button onClick={() => copy(revealed.raw)} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.35)", background: "#10b981", color: "#fff", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Copy</button>
            <button onClick={() => setRevealed(null)} style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, fontFamily: "DM Mono, monospace", fontSize: 12, cursor: "pointer" }}>Dismiss</button>
          </div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: muted }}>Key: {revealed.row.prefix}…{revealed.row.last4} · {revealed.row.name}</div>
        </div>
      )}

      <form onSubmit={create} style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap", padding: 14, borderRadius: 14, border: `1px solid ${border}`, background: cardBg }}>
        <label style={{ flex: 1, minWidth: 200, display: "grid", gap: 6 }}>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: muted }}>NEW KEY NAME</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. production, local-dev" maxLength={80} style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: fg, fontFamily: "DM Mono, monospace", fontSize: 13, outline: "none" }} />
        </label>
        <button type="submit" disabled={creating || !name.trim()} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.35)", background: creating || !name.trim() ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)") : "linear-gradient(135deg,#6366f1,#06b6d4)", color: creating || !name.trim() ? muted : "#fff", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", fontSize: 13, cursor: creating || !name.trim() ? "not-allowed" : "pointer" }}>{creating ? "Creating…" : "Create key"}</button>
      </form>

      {err && <div role="alert" style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: isLight ? "#9f1239" : "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{err}</div>}

      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBg, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: muted }}>YOUR KEYS · {rows.length} · limit 10 active</span>
          <button onClick={fetchRows} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>Refresh</button>
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>No keys yet — create one above.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: muted, borderBottom: `1px solid ${border}` }}>
                  <th style={{ padding: "10px 12px", fontWeight: 500 }}>NAME</th>
                  <th style={{ padding: "10px 12px", fontWeight: 500 }}>KEY</th>
                  <th style={{ padding: "10px 12px", fontWeight: 500 }}>STATUS</th>
                  <th style={{ padding: "10px 12px", fontWeight: 500 }}>LAST USED</th>
                  <th style={{ padding: "10px 12px", fontWeight: 500 }}>CREATED</th>
                  <th style={{ padding: "10px 12px", fontWeight: 500 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id} style={{ borderBottom: `1px solid ${border}` }}>
                    <td style={{ padding: "10px 12px" }}>
                      {editingId === r._id ? (
                        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: "6px 8px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: fg, fontFamily: "DM Mono, monospace", fontSize: 12, minWidth: 120 }} />
                          <button onClick={() => saveEdit(r._id)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.15)", color: "#10b981", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Save</button>
                          <button onClick={() => setEditingId(null)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: muted, fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                        </span>
                      ) : (
                        <span style={{ fontWeight: 600, color: fg }}>{r.name}</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>{r.prefix}…{r.last4}</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "3px 8px", borderRadius: 20, border: `1px solid ${r.status === "active" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, background: r.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: r.status === "active" ? "#10b981" : "#ef4444" }}>{r.status}</span></td>
                    <td style={{ padding: "10px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, color: muted }}>{r.last_used_at ? new Date(r.last_used_at).toLocaleString() : "—"}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "DM Mono, monospace", fontSize: 11, color: muted }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "10px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {editingId !== r._id && <button onClick={() => { setEditingId(r._id); setEditName(r.name); }} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Rename</button>}
                      {r.status === "active" && <button onClick={() => revoke(r._id)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.12)", color: "#f59e0b", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Revoke</button>}
                      <button onClick={() => del(r._id)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${border}`, background: isLight ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)", fontFamily: "DM Mono, monospace", fontSize: 11, lineHeight: 1.6, color: muted }}>
        <div style={{ fontWeight: 700, color: fg, marginBottom: 6 }}>Usage</div>
        <div>curl $BASE/chat/completions -H "X-Api-Key: sk-..." -H "Content-Type: application/json" -d &#123;"model":"auto","messages":[&#123;"role":"user","content":"Hello"&#125;]&#125;</div>
        <div style={{ marginTop: 6 }}>Also accepted: <code style={{ color: fg }}>Authorization: Bearer sk-...</code> (same key). JWT login still works for dashboard.</div>
      </div>
    </div>
  );
}
