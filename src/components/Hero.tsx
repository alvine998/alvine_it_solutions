import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { SITE } from "../lib/site";

export default function Hero() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const parallaxStyle = reduceMotion ? {} : { y, opacity };
  const stats = (t("hero.stats", { returnObjects: true }) as unknown as { value: string; label: string }[]) || [];

  return (
    <section
      id="home"
      ref={ref}
      aria-label="Introduction"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        paddingTop: 120,
        paddingBottom: 72,
        background: "linear-gradient(180deg, #f4f5fb 0%, #ffffff 70%)",
      }}
    >
      <motion.div
        style={{ ...parallaxStyle, position: "relative", zIndex: 10, textAlign: "center", maxWidth: 920, padding: "0 24px" }}
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
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
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
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
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
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
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}
        >
          <motion.a
            href={SITE.calendly}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={reduceMotion ? undefined : { scale: 1.03, boxShadow: "0 10px 28px rgba(79,70,229,0.35)" }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
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
              boxShadow: "0 6px 20px rgba(79,70,229,0.28)",
            }}
          >
            {t("hero.primaryCta", t("hero.exploreServices"))}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </motion.a>
          <motion.a
            href={SITE.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={reduceMotion ? undefined : { scale: 1.03, background: "#f0fdf4" }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
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
              border: "1px solid #bbf7d0",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
            }}
          >
            <span aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: "#22c55e" }} />
            {t("hero.secondaryCta", t("hero.learnMore"))}
          </motion.a>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95, duration: 0.7 }}
          style={{ marginTop: 18 }}
        >
          <a href="#portfolio" style={{
            fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
            color: "#4f46e5", textDecoration: "none",
            borderBottom: "1px solid #c9cdfc", paddingBottom: 2,
          }}>
            {t("hero.tertiaryCta", "See client results ↓")}
          </a>
        </motion.div>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
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

        {Array.isArray(stats) && stats.length > 0 && (
          <motion.dl
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 0,
              flexWrap: "wrap",
              margin: "32px auto 0",
              padding: 0,
              maxWidth: 560,
              background: "#fff",
              border: "1px solid #e6e8f0",
              borderRadius: 16,
              boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
              overflow: "hidden",
            }}
          >
            {stats.map((s, i) => (
              <div key={s.label} style={{
                flex: "1 1 140px",
                padding: "18px 12px",
                borderLeft: i > 0 ? "1px solid #eef0f4" : "none",
              }}>
                <dd style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 26, fontWeight: 800, color: "#0b1220" }}>{s.value}</dd>
                <dt style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>{s.label}</dt>
              </div>
            ))}
          </motion.dl>
        )}

        {!reduceMotion && (
          <motion.div
            className="hero-scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            style={{
              position: "absolute",
              bottom: -110,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
            aria-hidden
          >
            <span style={{ color: "#94a3b8", fontSize: 12, fontFamily: "Inter, sans-serif" }}>{t("hero.scrollDown")}</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 24,
                height: 40,
                borderRadius: 12,
                border: "2px solid #d4d7e3",
                display: "flex",
                justifyContent: "center",
                paddingTop: 8,
              }}
            >
              <div style={{ width: 3, height: 8, borderRadius: 2, background: "#94a3b8" }} />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
