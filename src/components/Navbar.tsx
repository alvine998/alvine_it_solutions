import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinkKeys = [
  { key: "home", href: "#home" },
  { key: "services", href: "#services" },
  { key: "aiRouter", href: "#ai-router" },
  { key: "pricing", href: "#pricing" },
  { key: "portfolio", href: "#portfolio" },
  { key: "marketplace", href: "/marketplace" },
  { key: "about", href: "#about" },
  { key: "team", href: "#team" },
  { key: "contact", href: "#contact" },
];

export default function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const check = () => setAuthed(!!localStorage.getItem("token") && !!(localStorage.getItem("user") || localStorage.getItem("router_customer")));
    check();
    window.addEventListener("storage", check);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => { window.removeEventListener("storage", check); window.removeEventListener("focus", onFocus); };
  }, []);

  // lock body when mobile open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  return (
    <motion.nav
      aria-label="Main navigation"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: scrolled ? "12px 0" : "18px 0",
        background: scrolled ? "rgba(10, 10, 20, 0.86)" : "rgba(10, 10, 20, 0.0)",
        backdropFilter: scrolled ? "blur(22px) saturate(1.25)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(22px) saturate(1.25)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.0)",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
        transition: "padding 0.25s ease, background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      {/* hairline glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.32) 22%, rgba(139,92,246,0.22) 48%, rgba(16,185,129,0.16) 78%, transparent)",
          opacity: scrolled ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* brand */}
        <motion.a
          href="#home"
          aria-label="Alvine IT Solutions — home"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 11,
            flexShrink: 0,
          }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
        >
          <motion.div
            whileHover={{ rotate: 1.5, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: "linear-gradient(135deg, #6366f1 0%, #7c5cf6 46%, #8b5cf6 100%)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.36), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.18)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: "-0.02em",
            }}
          >
            <span style={{ transform: "translateY(-0.5px)" }}>A</span>
          </motion.div>
          <span
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: "-0.03em",
              color: "#fff",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {t("nav.brand")}
          </span>
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: 50,
              background: "#10b981",
              boxShadow: "0 0 0 4px rgba(16,185,129,0.12), 0 0 8px rgba(16,185,129,0.5)",
              marginLeft: 2,
              flexShrink: 0,
            }}
          />
        </motion.a>

        {/* desktop links */}
        <div
          className="nav-links-desktop"
          style={{ display: "flex", alignItems: "center", gap: 22 }}
        >
          {navLinkKeys.map((link) => {
            const isRoute = link.href.startsWith("/");
            const isMarketplace = link.key === "marketplace";
            const baseStyle: React.CSSProperties = {
              textDecoration: "none",
              color: isMarketplace ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.68)",
              fontSize: 14,
              fontWeight: isMarketplace ? 600 : 500,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "-0.01em",
              padding: isMarketplace ? "6px 12px" : "6px 2px",
              borderRadius: isMarketplace ? 50 : 0,
              background: isMarketplace ? "rgba(99,102,241,0.12)" : "transparent",
              border: isMarketplace ? "1px solid rgba(99,102,241,0.22)" : "1px solid transparent",
              position: "relative",
              transition: "color 0.2s, background 0.2s, border-color 0.2s, transform 0.2s",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            };
            const content = (
              <>
                {isMarketplace && <span style={{ width: 5, height: 5, borderRadius: 50, background: "#6366f1", boxShadow: "0 0 6px rgba(99,102,241,0.6)" }} />}
                {t(`nav.${link.key}`)}
              </>
            );
            return isRoute ? (
              <Link
                key={link.key}
                to={link.href}
                style={baseStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                  if (isMarketplace) {
                    e.currentTarget.style.background = "rgba(99,102,241,0.18)";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.32)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isMarketplace ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.68)";
                  if (isMarketplace) {
                    e.currentTarget.style.background = "rgba(99,102,241,0.12)";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.22)";
                  }
                }}
              >
                {content}
              </Link>
            ) : (
              <a
                key={link.key}
                href={link.href}
                style={{ ...baseStyle, background: "transparent", border: "1px solid transparent", padding: "6px 2px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.68)")}
              >
                {content}
              </a>
            );
          })}
        </div>

        <div className="nav-cta-desktop" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ duration: 0.18 }}>
            <Link
              to={authed ? "/dashboard" : "/auth?mode=login"}
              style={{
                textDecoration: "none",
                padding: authed ? "9px 18px" : "10px 22px",
                borderRadius: 50,
                background: authed ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.01em",
                border: authed ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.14)",
                boxShadow: authed ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "0 6px 18px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (authed) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.11)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                } else {
                  e.currentTarget.style.boxShadow = "0 8px 22px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.22)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (authed) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                } else {
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.18)";
                  e.currentTarget.style.transform = "translateY(0px)";
                }
              }}
            >
              {authed ? t("nav.dashboard") : t("nav.login")}
              {!authed && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              )}
            </Link>
          </motion.div>
          <LanguageSwitcher />
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="mobile-menu-btn"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          style={{
            display: "none",
            background: mobileOpen ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            padding: 9,
            borderRadius: 12,
            width: 40,
            height: 40,
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, width: 18, height: 14 }}>
            <span
              style={{
                display: "block",
                width: 18,
                height: 2,
                background: "#fff",
                borderRadius: 2,
                transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.2s",
                transform: mobileOpen ? "rotate(45deg) translate(5px, 5px)" : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: 18,
                height: 2,
                background: "#fff",
                borderRadius: 2,
                opacity: mobileOpen ? 0 : 1,
                transform: mobileOpen ? "scaleX(0.6)" : "scaleX(1)",
                transition: "opacity 0.18s, transform 0.28s",
              }}
            />
            <span
              style={{
                display: "block",
                width: 18,
                height: 2,
                background: "#fff",
                borderRadius: 2,
                transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
                transform: mobileOpen ? "rotate(-45deg) translate(5px, -5px)" : "none",
              }}
            />
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              top: "100%",
              left: 12,
              right: 12,
              marginTop: 8,
              background: "rgba(14,14,24,0.96)",
              backdropFilter: "blur(24px) saturate(1.2)",
              WebkitBackdropFilter: "blur(24px) saturate(1.2)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              boxShadow: "0 16px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxHeight: "min(72vh, 560px)",
                overflowY: "auto",
                overscrollBehavior: "contain",
              }}
            >
              {navLinkKeys.map((link) => {
                const isRoute = link.href.startsWith("/");
                const isMarketplace = link.key === "marketplace";
                const itemStyle: React.CSSProperties = {
                  textDecoration: "none",
                  color: isMarketplace ? "#fff" : "rgba(255,255,255,0.82)",
                  fontSize: 15,
                  fontWeight: 500,
                  fontFamily: "Inter, sans-serif",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: isMarketplace ? "rgba(99,102,241,0.14)" : "transparent",
                  border: isMarketplace ? "1px solid rgba(99,102,241,0.22)" : "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                };
                return isRoute ? (
                  <Link
                    key={link.key}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    style={itemStyle}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {isMarketplace && <span style={{ width: 6, height: 6, borderRadius: 50, background: "#6366f1" }} />}
                      {t(`nav.${link.key}`)}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </Link>
                ) : (
                  <a
                    key={link.key}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    style={itemStyle}
                  >
                    <span>{t(`nav.${link.key}`)}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </a>
                );
              })}
              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "10px 6px 6px" }} />
              <Link
                to={authed ? "/dashboard" : "/auth?mode=login"}
                onClick={() => setMobileOpen(false)}
                style={{
                  textDecoration: "none",
                  margin: "4px 2px 8px",
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: authed ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "Inter, sans-serif",
                  textAlign: "center",
                  border: authed ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.14)",
                  boxShadow: authed ? "none" : "0 6px 18px rgba(99,102,241,0.32)",
                  display: "block",
                }}
              >
                {authed ? t("nav.dashboard") : t("nav.login")}
              </Link>
              <div style={{ padding: "2px 2px 2px", display: "flex", justifyContent: "center" }}>
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
