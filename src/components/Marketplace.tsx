import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface MarketplaceItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  tech: string[];
  category: string;
  images: string[];
  image: string;
  featured: boolean;
  sales: number;
}

const categoryGradients: Record<string, { gradient: string; glow: string }> = {
  web: { gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)", glow: "rgba(99,102,241,0.3)" },
  mobile: { gradient: "linear-gradient(135deg, #ec4899, #be185d)", glow: "rgba(236,72,153,0.3)" },
  desktop: { gradient: "linear-gradient(135deg, #f59e0b, #d97706)", glow: "rgba(245,158,11,0.3)" },
  api: { gradient: "linear-gradient(135deg, #06b6d4, #0891b2)", glow: "rgba(6,182,212,0.3)" },
  template: { gradient: "linear-gradient(135deg, #10b981, #059669)", glow: "rgba(16,185,129,0.3)" },
  other: { gradient: "linear-gradient(135deg, #6366f1, #06b6d4)", glow: "rgba(99,102,241,0.3)" },
};

function coverOf(item: MarketplaceItem): string {
  return (item.images && item.images[0]) || item.image || "";
}
function countOf(item: MarketplaceItem): number {
  return item.images?.length ?? (item.image ? 1 : 0);
}

function MarketplaceCard({ item, t }: { item: MarketplaceItem; t: (key: string, opts?: any) => string }) {
  const [hovered, setHovered] = useState(false);
  const colors = categoryGradients[item.category] || categoryGradients.other;
  const cover = coverOf(item);
  const count = countOf(item);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
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
        inset: 0,
        background: hovered ? `radial-gradient(circle at 50% 0%, ${colors.glow}, transparent 70%)` : "none",
        transition: "all 0.4s ease",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      <div style={{ position: "relative", overflow: "hidden", height: 180 }}>
        {cover ? (
          <motion.img
            src={cover}
            alt={item.name}
            animate={{ scale: hovered ? 1.1 : 1 }}
            transition={{ duration: 0.6 }}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: colors.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
            </svg>
          </div>
        )}
        {count > 1 && (
          <span style={{
            position: "absolute", right: 12, bottom: 12,
            padding: "4px 8px", borderRadius: 20,
            background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.18)",
            color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif",
          }}>{count} images</span>
        )}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(10,10,20,0.9) 0%, transparent 60%)",
        }} />
        {item.featured && (
          <span style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "5px 12px",
            borderRadius: 50,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}>
            {t("marketplace.featured")}
          </span>
        )}
        <span style={{
          position: "absolute",
          top: 12,
          right: 12,
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
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "20px 24px 24px" }}>
        <h3 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 20,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 8,
        }}>
          {item.name}
        </h3>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.6,
          marginBottom: 16,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {item.description}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {item.tech.slice(0, 4).map((t) => (
            <span key={t} style={{
              padding: "4px 10px",
              borderRadius: 50,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
            }}>
              {t}
            </span>
          ))}
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 16,
        }}>
          <span style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
          }}>
            {item.price === 0 ? t("marketplace.free") : `IDR ${item.price.toLocaleString("id-ID")}`}
          </span>
          <span style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
          }}>
            {item.sales} {t("marketplace.sales")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Marketplace() {
  const { t } = useTranslation();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/marketplace?status=active&limit=6")
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

  return (
    <section
      id="marketplace"
      style={{
        position: "relative",
        zIndex: 10,
        padding: "120px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
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
          color: "#10b981",
          textTransform: "uppercase",
          letterSpacing: 3,
          marginBottom: 16,
          display: "block",
        }}>
          {t("marketplace.eyebrow")}
        </span>
        <h2 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1.2,
          letterSpacing: "-1px",
        }}>
          {t("marketplace.headingPart1")}
          <span style={{
            background: "linear-gradient(135deg, #10b981, #6366f1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {t("marketplace.headingHighlight")}
          </span>
          {t("marketplace.headingPart2", "")}
        </h2>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 16,
          color: "rgba(255,255,255,0.5)",
          maxWidth: 560,
          margin: "16px auto 0",
          lineHeight: 1.7,
        }}>
          {t("marketplace.subtitle")}
        </p>
      </motion.div>

      {!loading && items.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 24px",
          borderRadius: 24,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "rgba(255,255,255,0.4)" }}>
            {t("marketplace.noItems")}
          </p>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 24,
      }}>
        {items.map((item) => (
          <MarketplaceCard key={item._id} item={item} t={t} />
        ))}
      </div>

      {loading && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 24,
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              borderRadius: 24,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              height: 380,
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ textAlign: "center", marginTop: 48 }}
        >
          <Link
            to="/marketplace"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              padding: "14px 32px",
              borderRadius: 50,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            {t("marketplace.viewAll")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.08; }
        }
        @media(max-width:768px) {
          #marketplace > div:last-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
