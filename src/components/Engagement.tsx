import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

type Model = { name: string; price: string; idr?: string; desc: string; features: string[]; cta: string; popular?: boolean };

export default function Engagement() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const models = (t("engagement.models", { returnObjects: true }) as unknown as Model[]) || [];

  return (
    <section id="engagement" aria-label="Engagement models" style={{ position: "relative", zIndex: 10, padding: "70px 24px 30px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: 2.5, display: "block", marginBottom: 14 }}>
          {t("engagement.eyebrow")}
        </span>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 800, color: "#0b1220", letterSpacing: "-1px", margin: "0 0 14px", lineHeight: 1.2 }}>
          {t("engagement.headingPart1")}
          <span style={{ color: "#047857" }}>
            {t("engagement.headingHighlight")}
          </span>
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#475569", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
          {t("engagement.sub")}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 20, alignItems: "stretch" }}>
        {models.map((m, i) => (
          <motion.div
            key={m.name}
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            style={{
              position: "relative", padding: "30px 26px", borderRadius: 20, display: "flex", flexDirection: "column",
              background: "#ffffff",
              border: m.popular ? "2px solid #4f46e5" : "1px solid #e6e8f0",
              boxShadow: m.popular
                ? "0 2px 4px rgba(16,24,40,0.05), 0 16px 40px rgba(79,70,229,0.14)"
                : "0 1px 2px rgba(16,24,40,0.05)",
            }}
          >
            {m.popular && (
              <span style={{
                position: "absolute", top: 16, right: 16, padding: "5px 12px", borderRadius: 50,
                background: "#4f46e5", color: "#fff",
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
              }}>
                Popular
              </span>
            )}
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 19, fontWeight: 700, color: "#0b1220", marginBottom: 6 }}>{m.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 30, fontWeight: 800, color: "#0b1220", letterSpacing: "-1px" }}>{m.price}</span>
              {m.idr && (
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12.5, color: "#475569", background: "#f1f2f7", border: "1px solid #e2e4ee", borderRadius: 50, padding: "4px 11px" }}>{m.idr}</span>
              )}
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#475569", lineHeight: 1.65, margin: "0 0 18px" }}>{m.desc}</p>
            <ul style={{ margin: "0 0 22px", padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
              {m.features.map((f) => (
                <li key={f} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#334155", lineHeight: 1.55 }}>
                  <span aria-hidden style={{ color: "#059669", fontWeight: 700, marginTop: 1 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <a href="#contact" style={{
              marginTop: "auto", display: "block", textAlign: "center", textDecoration: "none",
              padding: "13px 20px", borderRadius: 50, fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
              background: m.popular ? "#4f46e5" : "#0b1220",
              color: "#fff", border: "none",
            }}>
              {m.cta}
            </a>
          </motion.div>
        ))}
      </div>

      <p style={{ textAlign: "center", marginTop: 22, fontFamily: "DM Mono, monospace", fontSize: 12.5, color: "#6b7280", lineHeight: 1.7 }}>
        {t("engagement.note")}
      </p>
    </section>
  );
}
