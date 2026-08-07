import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export default function Hero() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <section
      id="home"
      ref={ref}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <motion.div
        style={{ y, opacity, scale, position: "relative", zIndex: 10, textAlign: "center", maxWidth: 900, padding: "0 24px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 50,
            background: "rgba(99, 102, 241, 0.15)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            marginBottom: 32,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#a5b4fc", fontSize: 14, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>
            {t("hero.badge")}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(40px, 8vw, 80px)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.1,
            marginBottom: 24,
            letterSpacing: "-2px",
          }}
        >
          {t("hero.titlePart1")}
          <span style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {t("hero.titleHighlight")}
          </span>
          <br />
          {t("hero.titlePart2")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.7,
            maxWidth: 600,
            margin: "0 auto 48px",
          }}
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
        >
          <motion.a
            href="#services"
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(99, 102, 241, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            style={{
              textDecoration: "none",
              padding: "16px 40px",
              borderRadius: 50,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {t("hero.exploreServices")}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          </motion.a>
          <motion.a
            href="#about"
            whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            style={{
              textDecoration: "none",
              padding: "16px 40px",
              borderRadius: 50,
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {t("hero.learnMore")}
          </motion.a>
        </motion.div>

        <motion.div
          className="hero-scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          style={{
            position: "absolute",
            bottom: -120,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "Inter, sans-serif" }}>{t("hero.scrollDown")}</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: 24,
              height: 40,
              borderRadius: 12,
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex",
              justifyContent: "center",
              paddingTop: 8,
            }}
          >
            <div style={{ width: 3, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.6)" }} />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
