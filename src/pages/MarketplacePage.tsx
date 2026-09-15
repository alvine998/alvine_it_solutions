import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";

interface MarketplaceItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  tech: string[];
  category: string;
  images: string[];
  image: string;
  demoUrl: string;
  downloadUrl: string;
  featured: boolean;
  sales: number;
}
function coverOf(item: MarketplaceItem): string { return (item.images && item.images[0]) || item.image || ""; }
function galleryOf(item: MarketplaceItem): string[] {
  if (Array.isArray(item.images) && item.images.length > 0) return item.images;
  if (item.image) return [item.image];
  return [];
}

const categoryGradients: Record<string, { gradient: string; glow: string }> = {
  web: { gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)", glow: "rgba(99,102,241,0.3)" },
  mobile: { gradient: "linear-gradient(135deg, #ec4899, #be185d)", glow: "rgba(236,72,153,0.3)" },
  desktop: { gradient: "linear-gradient(135deg, #f59e0b, #d97706)", glow: "rgba(245,158,11,0.3)" },
  api: { gradient: "linear-gradient(135deg, #06b6d4, #0891b2)", glow: "rgba(6,182,212,0.3)" },
  template: { gradient: "linear-gradient(135deg, #10b981, #059669)", glow: "rgba(16,185,129,0.3)" },
  other: { gradient: "linear-gradient(135deg, #6366f1, #06b6d4)", glow: "rgba(99,102,241,0.3)" },
};

const categories = ["all", "web", "mobile", "desktop", "api", "template", "other"] as const;

function DetailModal({ item, onClose, t }: { item: MarketplaceItem; onClose: () => void; t: (key: string, opts?: Record<string, unknown>) => string }) {
  const colors = categoryGradients[item.category] || categoryGradients.other;
  const gallery = galleryOf(item);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeSrc = gallery[Math.min(activeIdx, gallery.length - 1)] || "";
  const isMobileCat = item.category === "mobile";

  // keyboard: ESC closes lightbox first, then modal; arrows navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose();
      }
      if (gallery.length > 1 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        setActiveIdx((i) => (e.key === "ArrowLeft" ? (i - 1 + gallery.length) % gallery.length : (i + 1) % gallery.length));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, onClose, gallery.length]);

  // lock body scroll while modal/lightbox open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          borderRadius: 24,
          background: "rgba(15,15,25,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          position: "relative",
          overscrollBehavior: "contain",
        }}
        className="marketplace-detail-modal"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderRadius: 50,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.14)",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          ×
        </button>

        {gallery.length > 0 && (
          <div
            style={{
              position: "relative",
              width: "100%",
              background: "#08080f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            {/* full-size image: contain so mobile app screenshots are never cropped */}
            <img
              src={activeSrc}
              alt={item.name}
              onClick={() => setLightboxOpen(true)}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: isMobileCat ? "68vh" : "62vh",
                maxWidth: "100%",
                objectFit: "contain",
                display: "block",
                cursor: "zoom-in",
                background: "#08080f",
              }}
              loading="eager"
              decoding="async"
            />
            {/* subtle bottom scrim only for dots legibility — does not hide image */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 72,
                background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
            {/* expand hint */}
            <span
              onClick={() => setLightboxOpen(true)}
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                padding: "6px 10px",
                borderRadius: 50,
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(8px)",
                color: "rgba(255,255,255,0.9)",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                zIndex: 2,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
              {isMobileCat ? "Full view" : "Tap to expand"}
            </span>
            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => setActiveIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                  aria-label="Previous image"
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.58)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.16)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 18, zIndex: 2 }}
                >
                  ‹
                </button>
                <button
                  onClick={() => setActiveIdx((i) => (i + 1) % gallery.length)}
                  aria-label="Next image"
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.58)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.16)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 18, zIndex: 2 }}
                >
                  ›
                </button>
                <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2, padding: "6px 10px", borderRadius: 50, background: "rgba(0,0,0,0.38)", backdropFilter: "blur(8px)" }}>
                  {gallery.map((_, i) => (
                    <span key={i} style={{ width: i === activeIdx ? 22 : 8, height: 6, borderRadius: 3, background: i === activeIdx ? "#fff" : "rgba(255,255,255,0.45)", transition: "all 0.2s" }} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {gallery.length > 1 && (
          <div style={{ display: "flex", gap: 8, padding: "12px 16px 0", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            {gallery.map((url, i) => (
              <button
                key={`${url}-${i}`}
                onClick={() => setActiveIdx(i)}
                style={{
                  padding: 0,
                  flex: "0 0 72px",
                  width: 72,
                  height: 72,
                  border: i === activeIdx ? "2px solid #6366f1" : "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 10,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "#0a0a14",
                  flexShrink: 0,
                }}
              >
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>
            ))}
          </div>
        )}

        {/* fullscreen lightbox — true full-size, mobile-app friendly */}
        {lightboxOpen && (
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,0.96)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 16px 24px",
              cursor: "zoom-out",
            }}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              aria-label="Close fullscreen"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: 50,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
                fontSize: 22,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                zIndex: 2,
              }}
            >
              ×
            </button>
            {gallery.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + gallery.length) % gallery.length); }}
                  aria-label="Previous"
                  style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff", fontSize: 22, cursor: "pointer", display: "grid", placeItems: "center", zIndex: 2 }}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % gallery.length); }}
                  aria-label="Next"
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff", fontSize: 22, cursor: "pointer", display: "grid", placeItems: "center", zIndex: 2 }}
                >
                  ›
                </button>
                <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, padding: "8px 12px", borderRadius: 50, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", zIndex: 2 }}>
                  {gallery.map((_, i) => (
                    <span key={i} style={{ width: i === activeIdx ? 24 : 8, height: 6, borderRadius: 3, background: i === activeIdx ? "#fff" : "rgba(255,255,255,0.45)" }} />
                  ))}
                </div>
              </>
            )}
            <img
              src={activeSrc}
              alt={item.name}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "min(96vw, 1100px)",
                maxHeight: "92vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: "block",
                borderRadius: 12,
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                cursor: "default",
              }}
            />
          </div>
        )}

        <style>{`
          @media (max-width: 640px) {
            .marketplace-detail-modal { max-height: 92vh !important; border-radius: 20px !important; margin: 0 8px; }
            .marketplace-detail-modal-content { padding: 20px 20px 24px !important; }
          }
        `}</style>
        <div className="marketplace-detail-modal-content" style={{ padding: "24px 32px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{
              padding: "5px 12px",
              borderRadius: 50,
              background: colors.gradient,
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              textTransform: "uppercase",
            }}>
              {t(`marketplace.categories.${item.category}`)}
            </span>
            {item.featured && (
              <span style={{
                padding: "5px 12px",
                borderRadius: 50,
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                textTransform: "uppercase",
              }}>
                {t("marketplace.featured")}
              </span>
            )}
          </div>

          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 12,
          }}>
            {item.name}
          </h2>

          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 15,
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.8,
            marginBottom: 24,
          }}>
            {item.description}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {item.tech.map((tech) => (
              <span key={tech} style={{
                padding: "6px 14px",
                borderRadius: 50,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "Inter, sans-serif",
              }}>
                {tech}
              </span>
            ))}
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 20,
          }}>
            <span style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
            }}>
              {item.price === 0 ? t("marketplace.free") : `IDR ${item.price.toLocaleString("id-ID")}`}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              {item.demoUrl && (
                <a
                  href={item.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "Inter, sans-serif",
                    textDecoration: "none",
                  }}
                >
                  {t("marketplace.demo")}
                </a>
              )}
              {item.downloadUrl && (
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "Inter, sans-serif",
                    textDecoration: "none",
                  }}
                >
                  {t("marketplace.purchase")}
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  usePageMeta("marketplace");

  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/marketplace?status=active&limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCategory = activeCategory === "all" || item.category === activeCategory;
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase()) || item.tech.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [items, activeCategory, search]);

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh" }}>
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Marketplace navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: scrolled ? "10px 0" : "14px 0",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(16px) saturate(1.2)",
          WebkitBackdropFilter: "blur(16px) saturate(1.2)",
          borderBottom: "1px solid #e6e8f0",
          boxShadow: scrolled ? "0 4px 20px rgba(16,24,40,0.07)" : "none",
          transition: "padding 0.25s ease, background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "#eef0ff", opacity: 1 }} />
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}>
          <Link
            to="/"
            aria-label="Back to home"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}
          >
            <motion.div
              whileHover={{ scale: 1.04, rotate: 1.5 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: "#4f46e5",
                boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "-0.02em",
                flexShrink: 0,
              }}
            >
              <span style={{ transform: "translateY(-0.5px)" }}>A</span>
            </motion.div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: "-0.03em",
                color: "#0b1220",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}>
                {t("nav.brand")}
              </span>
              <span aria-hidden style={{ width: 1, height: 18, background: "#e6e8f0", flexShrink: 0 }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: 50,
                  background: "#16a34a",
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: "DM Mono, monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#475569",
                  lineHeight: 1,
                }}>
                  Marketplace
                </span>
              </span>
            </div>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* subtle count pill — shows live inventory */}
            <span
              aria-hidden
              className="mp-nav-count"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: 50,
                background: "#f1f2f7",
                border: "1px solid #e2e4ee",
                color: "#475569",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.01em",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: 50, background: "#94a3b8" }} />
              {items.length} items
            </span>
            <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ duration: 0.18 }}>
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 50,
                  background: "#0b1220",
                  border: "1px solid #0b1220",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "-0.01em",
                  transition: "background 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1e293b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0b1220";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                <span className="mp-back-label">{t("marketplace.backToHome")}</span>
              </Link>
            </motion.div>
          </div>
        </div>
        <style>{`
          @media (max-width: 640px) {
            .mp-nav-count { display: none !important; }
            .mp-back-label { font-size: 13px; }
          }
          @media (max-width: 380px) {
            .mp-back-label { display: none; }
          }
        `}</style>
      </motion.nav>

      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "120px 24px 80px",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <span style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: "#047857",
            textTransform: "uppercase",
            letterSpacing: 2.5,
            marginBottom: 14,
            display: "block",
          }}>
            {t("marketplace.eyebrow")}
          </span>
          <h1 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800,
            color: "#0b1220",
            lineHeight: 1.2,
            letterSpacing: "-1px",
            margin: "0 0 14px",
          }}>
            {t("marketplace.headingPart1")}
            <span style={{ color: "#047857" }}>
              {t("marketplace.headingHighlight")}
            </span>
            {t("marketplace.headingPart2", "")}
          </h1>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            color: "#475569",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            {t("marketplace.pageSubtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 48,
          }}
        >
          <div style={{ position: "relative", maxWidth: 480, width: "100%", margin: "0 auto" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={t("marketplace.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 18px 14px 44px",
                borderRadius: 16,
                border: "1px solid #d4d7e3",
                background: "#ffffff",
                boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
                color: "#0b1220",
                fontSize: 15,
                fontFamily: "Inter, sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 50,
                  background: activeCategory === cat ? "#4f46e5" : "#f1f2f7",
                  border: `1px solid ${activeCategory === cat ? "#4f46e5" : "#e2e4ee"}`,
                  color: activeCategory === cat ? "#fff" : "#3f4756",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t(`marketplace.categories.${cat}`)}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{
                borderRadius: 20,
                background: "#eef0f4",
                border: "1px solid #e6e8f0",
                height: 380,
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "80px 24px",
            borderRadius: 20,
            background: "#f6f7fb",
            border: "1px solid #e6e8f0",
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b6bcc9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#6b7280" }}>
              {t("marketplace.noResults")}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {filtered.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedItem(item)}
                style={{
                  position: "relative",
                  borderRadius: 20,
                  background: "#ffffff",
                  border: "1px solid #e6e8f0",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#c9cdfc";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(16,24,40,0.05), 0 16px 36px rgba(16,24,40,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e6e8f0";
                  e.currentTarget.style.boxShadow = "0 1px 2px rgba(16,24,40,0.05)";
                }}
              >
                <div style={{ position: "relative", overflow: "hidden", height: 180 }}>
                  {coverOf(item) ? (
                    <img src={coverOf(item)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      background: (categoryGradients[item.category] || categoryGradients.other).gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                      </svg>
                    </div>
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,18,32,0.55) 0%, transparent 55%)" }} />
                  {galleryOf(item).length > 1 && (
                    <span style={{ position: "absolute", right: 12, bottom: 12, padding: "4px 8px", borderRadius: 20, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                      {galleryOf(item).length} images
                    </span>
                  )}
                  {item.featured && (
                    <span style={{
                      position: "absolute", top: 12, left: 12,
                      padding: "5px 12px", borderRadius: 50,
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      fontFamily: "Inter, sans-serif", textTransform: "uppercase",
                    }}>
                      {t("marketplace.featured")}
                    </span>
                  )}
                  <span style={{
                    position: "absolute", top: 12, right: 12,
                    padding: "5px 12px", borderRadius: 50,
                    background: (categoryGradients[item.category] || categoryGradients.other).gradient,
                    color: "#fff", fontSize: 11, fontWeight: 600,
                    fontFamily: "Inter, sans-serif", textTransform: "uppercase",
                  }}>
                    {t(`marketplace.categories.${item.category}`)}
                  </span>
                </div>

                <div style={{ padding: "20px 24px 24px" }}>
                  <h3 style={{
                    fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 700,
                    color: "#0b1220", margin: "0 0 8px",
                  }}>
                    {item.name}
                  </h3>
                  <p style={{
                    fontFamily: "Inter, sans-serif", fontSize: 14,
                    color: "#475569", lineHeight: 1.6, margin: "0 0 16px",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {item.description}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {item.tech.slice(0, 4).map((tech) => (
                      <span key={tech} style={{
                        padding: "4px 10px", borderRadius: 50,
                        background: "#f1f2f7", border: "1px solid #e2e4ee",
                        color: "#3f4756", fontSize: 11, fontWeight: 500, fontFamily: "Inter, sans-serif",
                      }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderTop: "1px solid #eef0f4", paddingTop: 16,
                  }}>
                    <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 800, color: "#0b1220" }}>
                      {item.price === 0 ? t("marketplace.free") : `IDR ${item.price.toLocaleString("id-ID")}`}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6b7280" }}>
                      {item.sales} {t("marketplace.sales")}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} t={t} />
        )}
      </AnimatePresence>
    </div>
  );
}
