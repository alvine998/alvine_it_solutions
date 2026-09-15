import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Trust() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const items = (t("trust.items", { returnObjects: true }) as unknown as { title: string; desc: string }[]) || [];

  return (
    <section aria-label="Trust and risk reducers" style={{ position: "relative", zIndex: 10, padding: "70px 24px 10px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{
        borderRadius: 24, padding: "44px 32px",
        background: "#f6f7fb",
        border: "1px solid #e6e8f0",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#047857", display: "block", marginBottom: 12 }}>
            {t("trust.eyebrow")}
          </span>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#0b1220", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            {t("trust.headingPart1")}
            <span style={{ color: "#4f46e5" }}>
              {t("trust.headingHighlight")}
            </span>
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#475569", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            {t("trust.sub")}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              style={{ padding: "20px 18px", borderRadius: 16, background: "#ffffff", border: "1px solid #e6e8f0", boxShadow: "0 1px 2px rgba(16,24,40,0.05)" }}
            >
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14.5, fontWeight: 700, color: "#0b1220", marginBottom: 8 }}>{item.title}</div>
              <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#475569", lineHeight: 1.65 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <a href="#contact" style={{
            textDecoration: "none", padding: "13px 30px", borderRadius: 50,
            background: "#0b1220", color: "#fff",
            fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
          }}>
            {t("trust.cta")} →
          </a>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#6b7280" }}>
            {t("trust.profiles")}
          </span>
        </div>
      </div>
    </section>
  );
}
