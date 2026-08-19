import { useEffect, useState } from "react";
import { useCustomer } from "../../components/CustomerLayout";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";
import { FALLBACK_ROUTER_BASE, fetchActiveRouterBase } from "../../lib/routerBaseUrl";
import { toast } from "../../lib/toast";

export default function Profile() {
  const { user, token, refreshMe } = useCustomer();
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const [name, setName] = useState(user?.name ?? "");
  const [email] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [routerBase, setRouterBase] = useState(FALLBACK_ROUTER_BASE);
  useEffect(() => { fetchActiveRouterBase().then(b => { if (b) setRouterBase(b); }); }, []);

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.03)";
  const cardSoft = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const inputBg = isLight ? "#fff" : "#0f0f1a";
  const inputBgReadonly = isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const subMuted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const faintMuted = isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)";

  if (user && name === "" && user.name) {
    setTimeout(() => setName(user.name), 0);
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;
    setErr(""); setMsg(""); setSaving(true);
    try {
      const res = await fetch(`/api/router-customers/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setMsg("Profile updated.");
      const updated = data.router_customer ?? data;
      if (updated?.name || updated?.email) {
        const next = { id: updated._id ?? user.id, name: updated.name ?? name, email: updated.email ?? email, status: updated.status ?? user.status };
        localStorage.setItem("user", JSON.stringify(next));
        localStorage.setItem("router_customer", JSON.stringify(next));
      }
      await refreshMe();
    } catch (e: any) { setErr(e.message || "Failed"); }
    finally { setSaving(false); }
  };

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast("Copied"); } catch { toast("Copy failed"); } };

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 640, color: fg }}>
      <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, color: fg }}>Profile</h2>

      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBg, padding: 16, display: "grid", gap: 12, boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "grid", placeItems: "center", fontWeight: 800, color: "#fff" }}>{(user?.name?.[0] ?? "C").toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700, color: fg }}>{user?.name ?? "—"}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>{user?.email ?? "—"}</div>
          </div>
          <span style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 11, padding: "5px 9px", borderRadius: 20, background: user?.status === "active" ? "rgba(16,185,129,0.14)" : "rgba(245,158,11,0.12)", border: `1px solid ${user?.status === "active" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`, color: user?.status === "active" ? "#10b981" : "#f59e0b" }}>{user?.status ?? "—"}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, border: `1px solid ${border}`, padding: "5px 10px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>ID: {user?.id ?? "—"}</span>
          <button onClick={() => user?.id && copy(user.id)} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "5px 10px", borderRadius: 20, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>Copy ID</button>
        </div>
      </div>

      <form onSubmit={save} style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardSoft, padding: 16, display: "grid", gap: 14, boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div>
          <label style={{ display: "block", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: muted, marginBottom: 6 }}>NAME</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, border: `1px solid ${border}`, background: inputBg, color: fg, fontSize: 14, outline: "none" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: muted, marginBottom: 6 }}>EMAIL</label>
          <input
            value={email}
            readOnly
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, border: `1px solid ${border}`, background: inputBgReadonly, color: muted, fontSize: 14 }}
          />
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: faintMuted, marginTop: 6 }}>Email change requires support — contact us.</div>
        </div>

        {err && <div role="alert" style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: isLight ? "#9f1239" : "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{err}</div>}
        {msg && <div role="status" style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)", color: isLight ? "#065f46" : "#86efac", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{msg}</div>}

        <button type="submit" disabled={saving} style={{ padding: "11px 16px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.35)", background: saving ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)") : "linear-gradient(135deg,#6366f1,#06b6d4)", color: saving ? muted : "#fff", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: cardSoft, padding: 14, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: subMuted, marginBottom: 8 }}>API ACCESS</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <code style={{ flex: 1, minWidth: 200, fontFamily: "DM Mono, monospace", fontSize: 11.5, color: isLight ? "#1c1917" : "#e0e7ff", background: isLight ? "#f5f5f4" : "#0f0f1a", border: `1px solid ${border}`, padding: "9px 11px", borderRadius: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{routerBase}/chat/completions</code>
          <button onClick={() => copy(`${routerBase}/chat/completions`)} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "8px 11px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>Copy endpoint</button>
        </div>
        <button onClick={() => token && copy(token)} style={{ marginTop: 8, fontFamily: "DM Mono, monospace", fontSize: 11, padding: "7px 11px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.15)", color: "#6366f1", cursor: "pointer" }}>Copy token</button>
      </div>
    </div>
  );
}
