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
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
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

  return (
    <motion.nav
      aria-label="Main navigation"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: scrolled ? "12px 0" : "20px 0",
        background: scrolled ? "rgba(10, 10, 20, 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(99, 102, 241, 0.2)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          // gap: 50,
        }}
      >
        <motion.a
          href="#home"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
          whileHover={{ scale: 1.05 }}
        >
          <span
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: "#fff",
              letterSpacing: "-0.5px",
            }}
          >
            {t("nav.brand")}
          </span>
        </motion.a>

        <div
          className="nav-links-desktop"
          style={{ display: "flex", alignItems: "center", gap: 32 }}
        >
          {navLinkKeys.map((link) => (
            <motion.a
              key={link.key}
              href={link.href}
              style={{
                textDecoration: "none",
                color: "rgba(255,255,255,0.7)",
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
                transition: "color 0.2s",
              }}
              whileHover={{ color: "#fff", y: -2 }}
            >
              {t(`nav.${link.key}`)}
            </motion.a>
          ))}
        </div>
        <div className="nav-cta-desktop" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            to={authed ? "/dashboard" : "/auth?mode=login"}
            style={{
              textDecoration: "none",
              padding: "10px 24px",
              borderRadius: 50,
              background: authed ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              border: authed ? "1px solid rgba(255,255,255,0.14)" : "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {authed ? t("nav.dashboard") : t("nav.login")}
          </Link>
          <LanguageSwitcher />
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="mobile-menu-btn"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
          }}
        >
          <div
            style={{
              width: 24,
              height: 2,
              background: "#fff",
              marginBottom: 6,
              borderRadius: 2,
              transition: "all 0.3s",
              transform: mobileOpen
                ? "rotate(45deg) translate(5px, 5px)"
                : "none",
            }}
          />
          <div
            style={{
              width: 24,
              height: 2,
              background: "#fff",
              marginBottom: 6,
              borderRadius: 2,
              opacity: mobileOpen ? 0 : 1,
              transition: "all 0.3s",
            }}
          />
          <div
            style={{
              width: 24,
              height: 2,
              background: "#fff",
              borderRadius: 2,
              transition: "all 0.3s",
              transform: mobileOpen
                ? "rotate(-45deg) translate(5px, -5px)"
                : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "rgba(10, 10, 20, 0.95)",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {navLinkKeys.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    textDecoration: "none",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: "Inter, sans-serif",
                    padding: "8px 0",
                  }}
                >
                  {t(`nav.${link.key}`)}
                </a>
              ))}
              <Link
                to={authed ? "/dashboard" : "/auth?mode=login"}
                onClick={() => setMobileOpen(false)}
                style={{
                  textDecoration: "none",
                  color: authed ? "#fff" : "#8b5cf6",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  padding: "8px 0",
                  display: "inline-block",
                  border: authed ? "1px solid rgba(255,255,255,0.14)" : "none",
                  borderRadius: authed ? 999 : 0,
                  background: authed ? "rgba(255,255,255,0.06)" : "transparent",
                  textAlign: "center",
                }}
              >
                {authed ? t("nav.dashboard") : t("nav.login")}
              </Link>
              <div style={{ paddingTop: 8 }}>
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
