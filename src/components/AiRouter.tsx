import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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
        borderRadius: 24,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        padding: 24,
        overflow: "hidden",
      }}
    >
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "block" }} />
        </div>
        <span style={{ marginLeft: 12, fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>ai-router.ts — live</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontFamily: "DM Mono, monospace", fontSize: 11, color: "#10b981" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} /> 42ms avg
        </span>
      </div>

      {/* code: only auto */}
      <div style={{
        background: "rgba(0,0,0,0.4)",
        borderRadius: 14,
        padding: "14px 16px",
        fontFamily: "DM Mono, monospace",
        fontSize: 12.5,
        lineHeight: 1.7,
        color: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 18,
      }}>
        <span style={{ color: "#8b5cf6" }}>const</span> <span style={{ color: "#f472b6" }}>res</span> = <span style={{ color: "#8b5cf6" }}>await</span> router.<span style={{ color: "#60a5fa" }}>chat</span>({"{"}<br />
        &nbsp;&nbsp;model: <span style={{ color: "#a7f3d0" }}>"auto"</span> <span style={{ color: "rgba(255,255,255,0.4)" }}>// the only model — we route internally</span><br />
        &nbsp;&nbsp;messages: [<span style={{ color: "#a7f3d0" }}>"Explain quantum computing"</span>]<br />
        {"}"});
      </div>

      {/* single auto pill + flow */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: 14, borderRadius: 16,
        background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))",
        border: "1px solid rgba(99,102,241,0.3)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "grid", placeItems: "center", color: "#fff",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v4M12 16v6M4 12h4M16 12h4" /><circle cx="12" cy="12" r="3" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>auto</span>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)", color: "#6ee7b7" }}>only model you need</span>
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 4, lineHeight: 1.5 }}>
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
          <div key={s.l} style={{ textAlign: "center", padding: "10px 6px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>{s.v}</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AiRouter() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section
      id="ai-router"
      ref={ref}
      style={{
        position: "relative",
        zIndex: 10,
        padding: "120px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <motion.div style={{ y }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 50,
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.25)",
            fontFamily: "DM Mono, monospace",
            fontSize: 12,
            fontWeight: 600,
            color: "#a5b4fc",
            letterSpacing: 0.5,
            marginBottom: 20,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            {t("aiRouter.eyebrow")}
          </span>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.15,
            letterSpacing: "-1px",
            marginBottom: 16,
          }}>
            {t("aiRouter.headingPart1")}
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {t("aiRouter.headingHighlight")}
            </span>
            {t("aiRouter.headingPart2")}
          </h2>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 17,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.7,
            maxWidth: 640,
            margin: "0 auto",
          }}>
            {t("aiRouter.subtitle")}
          </p>
        </motion.div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.95fr", gap: 32, alignItems: "start" }} className="ai-router-grid">
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {featureKeys.map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                whileHover={{ y: -4, borderColor: "rgba(99,102,241,0.35)" }}
                style={{
                  padding: 20,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 11,
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  display: "grid", placeItems: "center",
                  color: "#a5b4fc", marginBottom: 14,
                }}>
                  {featureIcons[key]}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                  {t(`aiRouter.features.${key}.title`)}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                  {t(`aiRouter.features.${key}.desc`)}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}
          >
            <a
              href="#contact"
              style={{
                textDecoration: "none",
                padding: "13px 28px",
                borderRadius: 50,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
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
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {t("aiRouter.viewPricing")}
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <RouterVisual />
          <div style={{
            marginTop: 14,
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.18)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "DM Mono, monospace",
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
          }}>
            <span style={{ color: "#10b981" }}>✓</span> {t("aiRouter.compatible")}
          </div>
        </motion.div>
      </div>

      <style>{`@media(max-width:900px){.ai-router-grid{grid-template-columns:1fr !important;}}`}</style>
    </section>
  );
}
