import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SITE } from "../lib/site";

export default function Hero() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="home"
      aria-label="Introduction"
      style={{
        position: "relative",
        minHeight: "92vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        paddingTop: 120,
        paddingBottom: 72,
        background: "transparent",
      }}
    >
      <div
        style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 920, padding: "0 24px" }}
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 50,
            background: "#eef0ff",
            border: "1px solid #c9cdfc",
            marginBottom: 32,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} aria-hidden />
          <span style={{ color: "#4338ca", fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
            {t("hero.badge")}
          </span>
        </motion.div>

        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(38px, 7vw, 72px)",
            fontWeight: 800,
            color: "#0b1220",
            lineHeight: 1.08,
            marginBottom: 20,
            letterSpacing: "-2px",
          }}
        >
          {t("hero.titlePart1")}
          <span style={{ color: "#4f46e5" }}>
            {t("hero.titleHighlight")}
          </span>
          <br />
          {t("hero.titlePart2")}
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "#475569",
            lineHeight: 1.7,
            maxWidth: 640,
            margin: "0 auto 36px",
          }}
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}
        >
          <a
            href={SITE.calendly}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              padding: "16px 32px",
              borderRadius: 50,
              background: "#4f46e5",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              border: "1px solid #4f46e5",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {t("hero.primaryCta", t("hero.exploreServices"))}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              padding: "16px 32px",
              borderRadius: 50,
              background: "#ffffff",
              color: "#0b1220",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              border: "1px solid #d4d7e3",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: "#22c55e" }} />
            {t("hero.secondaryCta", t("hero.learnMore"))}
          </a>
        </motion.div>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          style={{
            marginTop: 28,
            fontFamily: "DM Mono, monospace",
            fontSize: 12.5,
            color: "#6b7280",
            lineHeight: 1.6,
          }}
        >
          {t("hero.trustLine")}
        </motion.p>
      </div>
    </section>
  );
}
