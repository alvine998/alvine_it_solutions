import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const serviceKeys = ["desktopApps", "websites", "restfulApi", "mobileApps"] as const;

const serviceIcons = [
  (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  ),
  (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
];

const serviceGradients = [
  { gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)", glowColor: "rgba(99, 102, 241, 0.3)" },
  { gradient: "linear-gradient(135deg, #06b6d4, #0891b2)", glowColor: "rgba(6, 182, 212, 0.3)" },
  { gradient: "linear-gradient(135deg, #f59e0b, #d97706)", glowColor: "rgba(245, 158, 11, 0.3)" },
  { gradient: "linear-gradient(135deg, #ec4899, #be185d)", glowColor: "rgba(236, 72, 153, 0.3)" },
];

const serviceTechs = [
  ["Electron", "Tauri", ".NET", "SQLite"],
  ["React", "Next.js", "TypeScript", "Tailwind"],
  ["Laravel", "Node.js", "Go", "PostgreSQL"],
  ["React Native", "Flutter", "Swift", "Kotlin"],
];

function ServiceCard({ index, t }: { index: number; t: (key: string) => string }) {
  const [hovered, setHovered] = useState(false);
  const key = serviceKeys[index];
  const colors = serviceGradients[index];
  const techs = serviceTechs[index];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        padding: 36,
        borderRadius: 20,
        background: "#ffffff",
        border: `1px solid ${hovered ? "#c9cdfc" : "#e6e8f0"}`,
        boxShadow: hovered
          ? "0 2px 4px rgba(16,24,40,0.05), 0 16px 36px rgba(79,70,229,0.12)"
          : "0 1px 2px rgba(16,24,40,0.05)",
        cursor: "default",
        transition: "all 0.3s ease",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: hovered ? colors.gradient : "#eef0f4",
        transition: "all 0.3s ease",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <motion.div
          animate={{ scale: hovered ? 1.1 : 1, rotate: hovered ? 5 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: colors.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            color: "#fff",
          }}
        >
          {serviceIcons[index]}
        </motion.div>

        <h3 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: "#0b1220",
          margin: "0 0 10px",
        }}>
          {t(`services.${key}.title`)}
        </h3>

        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 15,
          color: "#475569",
          lineHeight: 1.7,
          margin: "0 0 22px",
        }}>
          {t(`services.${key}.description`)}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {techs.map((tech) => (
            <span
              key={tech}
              style={{
                padding: "6px 14px",
                borderRadius: 50,
                background: "#f1f2f7",
                border: "1px solid #e2e4ee",
                color: "#3f4756",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Services() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section
      id="services"
      ref={sectionRef}
      aria-label="Services"
      style={{
        position: "relative",
        zIndex: 10,
        padding: "120px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <motion.div style={reduceMotion ? undefined : { y }}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 64 }}
        >
          <span style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: "#4f46e5",
            textTransform: "uppercase",
            letterSpacing: 2.5,
            marginBottom: 14,
            display: "block",
          }}>
            {t("services.eyebrow")}
          </span>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(30px, 4.5vw, 46px)",
            fontWeight: 800,
            color: "#0b1220",
            lineHeight: 1.2,
            letterSpacing: "-1px",
            margin: "0 0 14px",
          }}>
            {t("services.headingPart1")}
            <span style={{ color: "#4f46e5" }}>
              {t("services.headingHighlight")}
            </span>
            {t("services.headingPart2", "")}
          </h2>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            color: "#475569",
            maxWidth: 600,
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            {t("services.sub", "")}
          </p>
        </motion.div>
      </motion.div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24,
      }}>
        {serviceKeys.map((_, i) => (
          <ServiceCard key={i} index={i} t={t} />
        ))}
      </div>
    </section>
  );
}
