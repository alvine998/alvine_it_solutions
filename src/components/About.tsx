import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

const statKeys = ["projects", "clients", "experience", "support"] as const;
const statValues = ["100+", "50+", "5+", "24/7"];

const techStack = [
  "React Native", "Next.js", "TypeScript", "Laravel", "Node.js", "Go",
  "Flutter", "PostgreSQL", "MySQL", "Redis", "Docker", "AWS",
];

export default function About() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 5]);

  return (
    <section
      id="about"
      ref={sectionRef}
      style={{
        position: "relative",
        zIndex: 10,
        padding: "120px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }} className="about-grid">
        <motion.div style={{ y }}>
          <motion.span
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: "#4f46e5",
              textTransform: "uppercase",
              letterSpacing: 2.5,
              marginBottom: 14,
              display: "block",
            }}
          >
            {t("about.eyebrow")}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "clamp(30px, 4vw, 44px)",
              fontWeight: 800,
              color: "#0b1220",
              lineHeight: 1.2,
              letterSpacing: "-1px",
              margin: "0 0 22px",
            }}
          >
            {t("about.headingPart1")}
            <span style={{ color: "#4f46e5" }}>
              {t("about.headingHighlight")}
            </span>
            {t("about.headingPart2", "")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              color: "#475569",
              lineHeight: 1.8,
              margin: "0 0 20px",
            }}
          >
            {t("about.paragraph1")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              color: "#475569",
              lineHeight: 1.8,
              margin: "0 0 32px",
            }}
          >
            {t("about.paragraph2")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          >
            {techStack.map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: "8px 18px",
                  borderRadius: 50,
                  background: "#f1f2f7",
                  border: "1px solid #e2e4ee",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "Inter, sans-serif",
                  cursor: "default",
                }}
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div style={{ rotate }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {statKeys.map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                style={{
                  padding: 32,
                  borderRadius: 20,
                  background: "#ffffff",
                  border: "1px solid #e6e8f0",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
                  textAlign: "center",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 38,
                  fontWeight: 800,
                  color: "#0b1220",
                  marginBottom: 8,
                }}>
                  {statValues[i]}
                </div>
                <div style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  color: "#6b7280",
                  fontWeight: 500,
                }}>
                  {t(`about.stats.${key}`)}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
