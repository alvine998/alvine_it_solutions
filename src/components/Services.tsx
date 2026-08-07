import { motion, useScroll, useTransform } from "framer-motion";
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
  ["Electron", "Tauri", "Qt", ".NET"],
  ["React", "Next.js", "Vue", "TypeScript"],
  ["Node.js", "Go", "Python", "PostgreSQL"],
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
        padding: 40,
        borderRadius: 24,
        background: hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
        backdropFilter: "blur(10px)",
        cursor: "pointer",
        transition: "all 0.4s ease",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: hovered ? `radial-gradient(circle at 50% 0%, ${colors.glowColor}, transparent 70%)` : "none",
        transition: "all 0.4s ease",
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
          fontSize: 24,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 12,
        }}>
          {t(`services.${key}.title`)}
        </h3>

        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 15,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.7,
          marginBottom: 24,
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
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
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
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: "#8b5cf6",
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 16,
            display: "block",
          }}>
            {t("services.eyebrow")}
          </span>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.2,
            letterSpacing: "-1px",
          }}>
            {t("services.headingPart1")}
            <span style={{
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {t("services.headingHighlight")}
            </span>
            {t("services.headingPart2", "")}
          </h2>
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
