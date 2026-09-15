import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Process() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const steps = (t("process.steps", { returnObjects: true }) as unknown as { title: string; desc: string }[]) || [];

  return (
    <section id="process" aria-label="Development process" style={{ position: "relative", zIndex: 10, padding: "90px 24px 30px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 44 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: 2.5, display: "block", marginBottom: 14 }}>
          {t("process.eyebrow")}
        </span>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 800, color: "#0b1220", letterSpacing: "-1px", margin: "0 0 14px", lineHeight: 1.2 }}>
          {t("process.headingPart1")}
          <span style={{ color: "#4f46e5" }}>
            {t("process.headingHighlight")}
          </span>
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#475569", maxWidth: 620, margin: "0 auto", lineHeight: 1.7 }}>
          {t("process.sub")}
        </p>
      </div>

      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {steps.map((s, i) => (
          <motion.li
            key={s.title}
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            style={{
              padding: "24px 20px", borderRadius: 18,
              background: "#ffffff", border: "1px solid #e6e8f0",
              boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
            }}
          >
            <div aria-hidden style={{
              width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center",
              background: i === 0 ? "#4f46e5" : "#eef0ff",
              border: "1px solid #c9cdfc",
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 14,
              color: i === 0 ? "#fff" : "#4338ca",
              marginBottom: 14,
            }}>
              {i + 1}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, color: "#0b1220", marginBottom: 8, lineHeight: 1.4 }}>
              {s.title}
            </div>
            <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#475569", lineHeight: 1.65 }}>
              {s.desc}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
