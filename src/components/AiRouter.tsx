import { useTranslation } from "react-i18next";

const featureKeys = ["routing", "cost", "unifiedApi", "fallback", "observability", "byok"] as const;

const featureIcons: Record<string, React.ReactNode> = {
  routing: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 16v6M4 12h4M16 12h4M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  cost: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  unifiedApi: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15h6M9 11h6" />
    </svg>
  ),
  fallback: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
      <path d="M12 8v5l3 2" />
    </svg>
  ),
  observability: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 3 3 5-7" />
    </svg>
  ),
  byok: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
};

function RouterVisual() {

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        background: "#ffffff",
        border: "1px solid #e6e8f0",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 16px 40px rgba(16,24,40,0.09)",
        padding: 24,
        overflow: "hidden",
      }}
    >
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f87171", display: "block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24", display: "block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399", display: "block" }} />
        </div>
        <span style={{ marginLeft: 12, fontFamily: "DM Mono, monospace", fontSize: 12, color: "#94a3b8" }}>ai-router.ts — live</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontFamily: "DM Mono, monospace", fontSize: 11, color: "#047857" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} /> 42ms avg
        </span>
      </div>

      {/* code: only auto — dark inset window reads as intentional on a light page */}
      <div style={{
        background: "#0b1220",
        borderRadius: 14,
        padding: "14px 16px",
        fontFamily: "DM Mono, monospace",
        fontSize: 12.5,
        lineHeight: 1.7,
        color: "rgba(255,255,255,0.88)",
        border: "1px solid #1e293b",
        marginBottom: 18,
        overflowX: "auto",
      }}>
        <span style={{ color: "#a5b4fc" }}>const</span> <span style={{ color: "#f9a8d4" }}>res</span> = <span style={{ color: "#a5b4fc" }}>await</span> router.<span style={{ color: "#93c5fd" }}>chat</span>({"{"}<br />
        &nbsp;&nbsp;model: <span style={{ color: "#6ee7b7" }}>"auto"</span> <span style={{ color: "rgba(255,255,255,0.45)" }}>// the only model — we route internally</span><br />
        &nbsp;&nbsp;messages: [<span style={{ color: "#6ee7b7" }}>"Explain quantum computing"</span>]<br />
        {"}"});
      </div>

      {/* single auto pill + flow */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: 14, borderRadius: 16,
        background: "#eef0ff",
        border: "1px solid #c9cdfc",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "#4f46e5",
          display: "grid", placeItems: "center", color: "#fff",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v4M12 16v6M4 12h4M16 12h4" /><circle cx="12" cy="12" r="3" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 16, color: "#0b1220" }}>auto</span>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857" }}>only model you need</span>
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#475569", marginTop: 4, lineHeight: 1.5 }}>
            One name, every provider. Router picks the cheapest fast-enough model behind the scenes — fallback included.
          </div>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
        {[
          { v: "−68%", l: "cost saved" },
          { v: "99.9%", l: "uptime" },
          { v: "<50ms", l: "routing" },
        ].map((s) => (
          <div key={s.l} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 12, background: "#f6f7fb", border: "1px solid #e6e8f0" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 16, color: "#0b1220" }}>{s.v}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AiRouter() {
  const { t } = useTranslation();

  return (
    <section
      id="ai-router"
      style={{
        position: "relative",
        zIndex: 10,
        padding: "110px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
        <div
          style={{ textAlign: "left", marginBottom: 48, maxWidth: 700 }}
        >
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 50,
            background: "#eef0ff",
            border: "1px solid #c9cdfc",
            fontFamily: "DM Mono, monospace",
            fontSize: 12,
            fontWeight: 600,
            color: "#4338ca",
            letterSpacing: 0.5,
            marginBottom: 20,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
            {t("aiRouter.eyebrow")}
          </span>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(30px, 4.5vw, 46px)",
            fontWeight: 800,
            color: "#0b1220",
            lineHeight: 1.15,
            letterSpacing: "-1px",
            margin: "0 0 14px",
          }}>
            {t("aiRouter.headingPart1")}
            {t("aiRouter.headingHighlight")}
            {t("aiRouter.headingPart2")}
          </h2>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 17,
            color: "#475569",
            lineHeight: 1.7,
            maxWidth: 640,
            margin: 0,
          }}>
            {t("aiRouter.subtitle")}
          </p>
        </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.95fr", gap: 32, alignItems: "start" }} className="ai-router-grid">
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {featureKeys.map((key) => (
              <div
                key={key}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: "#ffffff",
                  border: "1px solid #e6e8f0",
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 11,
                  background: "#eef0ff",
                  border: "1px solid #c9cdfc",
                  display: "grid", placeItems: "center",
                  color: "#4f46e5", marginBottom: 14,
                }}>
                  {featureIcons[key]}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, color: "#0b1220", marginBottom: 6 }}>
                  {t(`aiRouter.features.${key}.title`)}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                  {t(`aiRouter.features.${key}.desc`)}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}
          >
            <a
              href="#contact"
              style={{
                textDecoration: "none",
                padding: "13px 28px",
                borderRadius: 50,
                background: "#0b1220",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {t("aiRouter.tryDemo")} <span>→</span>
            </a>
            <a
              href="#pricing"
              style={{
                textDecoration: "none",
                padding: "13px 28px",
                borderRadius: 50,
                background: "#ffffff",
                border: "1px solid #d4d7e3",
                color: "#0b1220",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {t("aiRouter.viewPricing")}
            </a>
          </div>
        </div>

        <div>
          <RouterVisual />
          <div style={{
            marginTop: 14,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #e6e8f0",
            background: "#f6f7fb",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "DM Mono, monospace",
            fontSize: 12,
            color: "#334155",
          }}>
            <span aria-hidden style={{ color: "#047857" }}>—</span> {t("aiRouter.compatible")}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:900px){.ai-router-grid{grid-template-columns:1fr !important;}}`}</style>
    </section>
  );
}
