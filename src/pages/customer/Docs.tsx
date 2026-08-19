import { useEffect, useState } from "react";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";
import { FALLBACK_ROUTER_BASE, fetchActiveRouterBase } from "../../lib/routerBaseUrl";
import { toast } from "../../lib/toast";

export default function Docs() {
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast("Copied"); } catch { toast("Copy failed"); } };
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [base, setBase] = useState(FALLBACK_ROUTER_BASE);
  useEffect(() => { fetchActiveRouterBase().then(b => { if (b) setBase(b); }); }, []);

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const cardBg3 = isLight ? "#fff" : "rgba(255,255,255,0.03)";
  const codeBg = isLight ? "#f5f5f4" : "#0f0f1a";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const subMuted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const faint = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  const curl = `curl ${base}/chat/completions \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`;

  const openaiJs = `import OpenAI from "openai";
const client = new OpenAI({
  baseURL: "${base}",
  apiKey: process.env.ROUTER_TOKEN,
});
const res = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Hello" }],
});`;

  const py = `from openai import OpenAI
client = OpenAI(
  base_url="${base}",
  api_key="ROUTER_TOKEN",
)
res = client.chat.completions.create(
  model="auto",
  messages=[{"role": "user", "content": "Hello"}],
)
print(res.choices[0].message.content)`;

  const Code = ({ title, code }: { title: string; code: string }) => (
    <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: cardBg, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${faint}`, background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.7, color: muted }}>{title}</span>
        <button onClick={() => copy(code)} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>Copy</button>
      </div>
      <pre style={{ margin: 0, padding: 14, background: codeBg, color: isLight ? "#1c1917" : "#e0e7ff", fontFamily: "DM Mono, monospace", fontSize: 12.5, lineHeight: 1.6, overflowX: "auto" }}>{code}</pre>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 16, color: fg }}>
      <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, color: fg }}>Docs</h2>
      <p style={{ margin: 0, color: muted, fontSize: 13.5, lineHeight: 1.7 }}>
        OpenAI-compatible. Change <span style={{ color: fg, fontFamily: "DM Mono, monospace", fontWeight: 600 }}>baseURL</span> only. Auth via <span style={{ color: fg, fontFamily: "DM Mono, monospace", fontWeight: 600 }}>Authorization: Bearer &lt;token&gt;</span>. Model is always <span style={{ color: "#6366f1", fontFamily: "DM Mono, monospace" }}>auto</span> (router picks best).
      </p>

      <div style={{ display: "grid", gap: 12, fontFamily: "DM Mono, monospace", fontSize: 12, lineHeight: 1.7 }}>
        <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: cardBg3, padding: 14, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
          <div style={{ color: "#6366f1", letterSpacing: 0.6, fontSize: 11, marginBottom: 6 }}>ENDPOINT</div>
          <code style={{ color: isLight ? "#1c1917" : "#e0e7ff", wordBreak: "break-all" }}>{base}/chat/completions</code>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => copy(`${base}/chat/completions`)} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>Copy endpoint</button>
            {token && <button onClick={() => copy(token)} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.15)", color: "#6366f1", cursor: "pointer" }}>Copy token</button>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }} className="docs-grid">
          <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: cardBg, padding: 14, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
            <div style={{ color: subMuted, fontSize: 11, letterSpacing: 0.6 }}>AUTH</div>
            <div style={{ color: fg, marginTop: 4 }}>Authorization: Bearer &lt;token&gt;</div>
          </div>
          <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: cardBg, padding: 14, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
            <div style={{ color: subMuted, fontSize: 11, letterSpacing: 0.6 }}>MODEL</div>
            <div style={{ color: "#6366f1", marginTop: 4 }}>auto</div>
          </div>
        </div>
      </div>

      <Code title="cURL" code={curl} />
      <Code title="Node.js (OpenAI SDK)" code={openaiJs} />
      <Code title="Python (OpenAI SDK)" code={py} />

      <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(16,185,129,0.06)", padding: 14, fontFamily: "DM Mono, monospace", fontSize: 12, lineHeight: 1.7, color: muted, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
        <span style={{ color: "#10b981" }}>✓</span> Billing is per 1k tokens via credits — see <span style={{ color: fg, fontWeight: 700 }}>Usage</span> for consumption. Need help? Chat via WhatsApp.
      </div>

      <style>{`@media(max-width: 860px){ .docs-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
