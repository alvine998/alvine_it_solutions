import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";
import { FALLBACK_ROUTER_BASE, fetchActiveRouterBase } from "../../lib/routerBaseUrl";
import { toast } from "../../lib/toast";

type RunState = { status: number; latencyMs: number; body: string; credits: any };

export default function Documentation() {
  const { t } = useTranslation();
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const [base, setBase] = useState(FALLBACK_ROUTER_BASE);
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("Hello, who are you?");
  const [running, setRunning] = useState(false);
  const [resp, setResp] = useState<RunState | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  useEffect(() => { fetchActiveRouterBase().then(b => { if (b) setBase(b); }); }, []);

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.03)";
  const codeBg = isLight ? "#f5f5f4" : "#0f0f1a";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const subMuted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const accent = "#6366f1";
  const codeFg = isLight ? "#1c1917" : "#e0e7ff";

  const copy = async (text: string, kind: "endpoint" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === "endpoint") { setCopiedEndpoint(true); setTimeout(() => setCopiedEndpoint(false), 1600); }
      else { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1600); }
    } catch { toast("Copy failed"); }
  };

  const curlSnippet = useMemo(() => {
    const key = apiKey.trim() || "sk-...";
    return `curl ${base}/chat/completions \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"${prompt}"}]}'`;
  }, [base, apiKey, prompt]);

  const run = async () => {
    const key = apiKey.trim();
    if (!key) { toast(t("customer.documentation.noKeyHint")); return; }
    setRunning(true);
    setResp(null);
    const started = performance.now();
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: "auto", messages: [{ role: "user", content: prompt }] }),
      });
      const text = await res.text();
      const latencyMs = Math.round(performance.now() - started);
      let body = text;
      let credits: any = null;
      try { const j = JSON.parse(text); body = JSON.stringify(j, null, 2); credits = j._credits ?? null; } catch {}
      setResp({ status: res.status, latencyMs, body, credits });
    } catch (e: any) {
      setResp({ status: 0, latencyMs: Math.round(performance.now() - started), body: String(e?.message || "Network error"), credits: null });
    } finally {
      setRunning(false);
    }
  };

  const statusColor = (s: number) => (s >= 200 && s < 300 ? "#10b981" : s === 0 ? "#f59e0b" : "#ef4444");
  const usage = resp ? (() => { try { return JSON.parse(resp.body).usage; } catch { return null; } })() : null;

  const sections = [
    { title: t("customer.documentation.overviewTitle"), body: t("customer.documentation.overview") },
    { title: t("customer.documentation.creditsTitle"), body: t("customer.documentation.credits") },
    { title: t("customer.documentation.autoTitle"), body: t("customer.documentation.auto") },
    { title: t("customer.documentation.authTitle"), body: t("customer.documentation.auth") },
    { title: t("customer.documentation.fallbackTitle"), body: t("customer.documentation.fallback") },
  ];

  const concepts = [
    { title: t("customer.documentation.concept1Title"), body: t("customer.documentation.concept1Body") },
    { title: t("customer.documentation.concept2Title"), body: t("customer.documentation.concept2Body") },
    { title: t("customer.documentation.concept3Title"), body: t("customer.documentation.concept3Body") },
  ];

  return (
    <div style={{ display: "grid", gap: 18, color: fg }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 800, color: fg }}>{t("customer.documentation.title")}</h2>
        <p style={{ margin: "6px 0 0", color: muted, fontSize: 13.5, lineHeight: 1.7, maxWidth: 720 }}>{t("customer.documentation.subtitle")}</p>
      </div>

      {/* Endpoint */}
      <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: cardBg, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1, color: accent, fontWeight: 700 }}>{t("customer.documentation.endpointLabel")}</span>
          <span style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted }}>{t("customer.documentation.endpointHint")}</span>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <code style={{ flex: 1, minWidth: 240, color: codeFg, fontFamily: "DM Mono, monospace", fontSize: 12.5, wordBreak: "break-all" }}>{base}/chat/completions</code>
          <button onClick={() => copy(`${base}/chat/completions`, "endpoint")} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{copiedEndpoint ? t("customer.documentation.copied") : t("customer.documentation.copyEndpoint")}</button>
        </div>
      </div>

      {/* Playground */}
      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBg, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: fg }}>{t("customer.documentation.requestTitle")}</span>
          <span style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1px solid ${border}`, color: subMuted, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }}>{t("customer.documentation.requestLang")}</span>
        </div>
        <div style={{ padding: 18, display: "grid", gap: 14 }}>
          <p style={{ margin: 0, color: muted, fontSize: 13, lineHeight: 1.7 }}>{t("customer.documentation.requestDesc")}</p>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted }}>{t("customer.documentation.apiKeyLabel")}</label>
            <input
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={t("customer.documentation.apiKeyPlaceholder")}
              style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${border}`, background: codeBg, color: codeFg, fontFamily: "DM Mono, monospace", fontSize: 13, outline: "none" }}
            />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted }}>PROMPT</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={2}
              style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${border}`, background: codeBg, color: codeFg, fontFamily: "DM Mono, monospace", fontSize: 13, outline: "none", resize: "vertical" }}
            />
          </div>
          <button onClick={run} disabled={running} style={{ alignSelf: "flex-start", padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.35)", background: running ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)") : "linear-gradient(135deg,#6366f1,#06b6d4)", color: running ? muted : "#fff", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", fontSize: 13, cursor: running ? "not-allowed" : "pointer" }}>{running ? t("customer.documentation.running") : t("customer.documentation.run")}</button>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted }}>cURL</span>
              <button onClick={() => copy(curlSnippet, "code")} style={{ marginLeft: "auto", padding: "5px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer", fontFamily: "DM Mono, monospace", fontSize: 11 }}>{copiedCode ? t("customer.documentation.copied") : t("customer.documentation.copyEndpoint")}</button>
            </div>
            <pre style={{ margin: 0, padding: 12, borderRadius: 10, background: codeBg, color: codeFg, fontFamily: "DM Mono, monospace", fontSize: 12, lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{curlSnippet}</pre>
          </div>
        </div>
      </div>

      {/* Response */}
      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBg, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: fg }}>{t("customer.documentation.responseTitle")}</span>
          {resp && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted }}>
              <span><span style={{ color: statusColor(resp.status) }}>{resp.status || "ERR"}</span> · {t("customer.documentation.status")}</span>
              <span>{resp.latencyMs}ms · {t("customer.documentation.latency")}</span>
            </div>
          )}
        </div>
        <div style={{ padding: 16 }}>
          {!resp ? (
            <div style={{ padding: "24px 0", textAlign: "center", fontFamily: "DM Mono, monospace", fontSize: 12, color: subMuted }}>{t("customer.documentation.responsePlaceholder")}</div>
          ) : (
            <pre style={{ margin: 0, padding: 14, borderRadius: 10, background: codeBg, color: codeFg, fontFamily: "DM Mono, monospace", fontSize: 12, lineHeight: 1.65, overflowX: "auto", maxHeight: 360, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{resp.body}</pre>
          )}
        </div>
        {resp && usage && (
          <div style={{ padding: "10px 18px", borderTop: `1px solid ${border}`, display: "flex", gap: 16, flexWrap: "wrap", fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted }}>
            <span style={{ color: accent, fontWeight: 700 }}>{t("customer.documentation.usageLabel")}</span>
            <span>{t("customer.documentation.promptTokens")}: {usage.prompt_tokens ?? "—"}</span>
            <span>{t("customer.documentation.completionTokens")}: {usage.completion_tokens ?? "—"}</span>
            <span>{t("customer.documentation.totalTokens")}: {usage.total_tokens ?? "—"}</span>
            {resp.credits && <span style={{ color: "#10b981" }}>−{resp.credits.credit_out} {t("customer.documentation.creditsDeducted")} · balance {resp.credits.balance}</span>}
          </div>
        )}
      </div>

      {/* Quickstart */}
      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBg, padding: 18 }}>
        <h3 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: fg }}>{t("customer.documentation.quickstartTitle")}</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {[
            { title: t("customer.documentation.quickstart1"), body: t("customer.documentation.quickstart1Desc"), href: "/dashboard/api-keys", cta: "API Keys" },
            { title: t("customer.documentation.quickstart2"), body: t("customer.documentation.quickstart2Desc", { base: `${base}/chat/completions` }), href: "/dashboard/integration", cta: "Integration" },
            { title: t("customer.documentation.quickstart3"), body: t("customer.documentation.quickstart3Desc"), href: "/dashboard/usage", cta: "Usage" },
          ].map((s) => (
            <div key={s.title} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", borderRadius: 12, border: `1px solid ${border}`, background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: accent, display: "grid", placeItems: "center", fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.title.charAt(0)}</span>
              <div style={{ display: "grid", gap: 4, flex: 1 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: fg }}>{s.title}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.6, color: muted }}>{s.body}</span>
              </div>
              <Link to={s.href} style={{ alignSelf: "center", fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: `1px solid rgba(99,102,241,0.3)`, background: "rgba(99,102,241,0.1)", color: accent, textDecoration: "none", whiteSpace: "nowrap" }}>{s.cta} →</Link>
            </div>
          ))}
        </div>
      </div>

      {/* Concepts */}
      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBg, padding: 18 }}>
        <h3 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: fg }}>{t("customer.documentation.conceptsTitle")}</h3>
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {concepts.map((c) => (
            <div key={c.title} style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${border}`, background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: fg, marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: muted }}>{c.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Concepts detail (deep dive) */}
      <div style={{ display: "grid", gap: 14 }}>
        {sections.map((s) => (
          <section key={s.title} style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBg, padding: 18, boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
            <h3 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: fg }}>{s.title}</h3>
            <p style={{ margin: "10px 0 0", color: muted, fontSize: 13.5, lineHeight: 1.75 }}>{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
