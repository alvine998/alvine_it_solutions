import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Home", href: "#home" },
  { name: "Services", href: "#services" },
  { name: "Portfolio", href: "#portfolio" },
  { name: "About", href: "#about" },
  { name: "Team", href: "#team" },
  { name: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
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
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <motion.a
          href="#home"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}
          whileHover={{ scale: 1.05 }}
        >
          <span style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: "#fff",
            letterSpacing: "-0.5px",
          }}>
            Alvine<span style={{ color: "#8b5cf6" }}> IT SOLUTIONS</span>
          </span>
        </motion.a>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="nav-links-desktop">
          {navLinks.map((link) => (
            <motion.a
              key={link.name}
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
              {link.name}
            </motion.a>
          ))}
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              textDecoration: "none",
              padding: "10px 24px",
              borderRadius: 50,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              border: "none",
              cursor: "pointer",
            }}
          >
            Get Started
          </motion.a>
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
          <div style={{ width: 24, height: 2, background: "#fff", marginBottom: 6, borderRadius: 2, transition: "all 0.3s", transform: mobileOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <div style={{ width: 24, height: 2, background: "#fff", marginBottom: 6, borderRadius: 2, opacity: mobileOpen ? 0 : 1, transition: "all 0.3s" }} />
          <div style={{ width: 24, height: 2, background: "#fff", borderRadius: 2, transition: "all 0.3s", transform: mobileOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </div>

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
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {navLinks.map((link) => (
                <a
                  key={link.name}
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
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
