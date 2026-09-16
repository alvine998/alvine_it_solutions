import { useEffect, useState } from "react";
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

const CATEGORY_BADGE = "#0b1220";

function coverOf(item: MarketplaceItem): string {
  return (item.images && item.images[0]) || item.image || "";
}
function countOf(item: MarketplaceItem): number {
  return item.images?.length ?? (item.image ? 1 : 0);
}

function MarketplaceCard({ item, t }: { item: MarketplaceItem; t: (key: string, opts?: Record<string, unknown>) => string }) {
  const cover = coverOf(item);
  const count = countOf(item);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #e6e8f0",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden", height: 180 }}>
        {cover ? (
          <img
            src={cover}
            alt={item.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: "#f1f2f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b6bcc9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
          background: "linear-gradient(to top, rgba(11,18,32,0.55) 0%, transparent 55%)",
        }} />
        {item.featured && (
          <span style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "5px 12px",
            borderRadius: 50,
            background: CATEGORY_BADGE,
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
          background: "rgba(255,255,255,0.94)",
          border: "1px solid #e2e4ee",
          color: "#0b1220",
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
          color: "#0b1220",
          margin: "0 0 8px",
        }}>
          {item.name}
        </h3>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          color: "#475569",
          lineHeight: 1.6,
          margin: "0 0 16px",
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
              background: "#f1f2f7",
              border: "1px solid #e2e4ee",
              color: "#3f4756",
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
          borderTop: "1px solid #eef0f4",
          paddingTop: 16,
        }}>
          <span style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#0b1220",
          }}>
            {item.price === 0 ? t("marketplace.free") : `IDR ${item.price.toLocaleString("id-ID")}`}
          </span>
          <span style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            color: "#6b7280",
          }}>
            {item.sales} {t("marketplace.sales")}
          </span>
        </div>
      </div>
    </div>
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
      <div
        style={{ textAlign: "left", marginBottom: 48, maxWidth: 680 }}
      >
        <span style={{
          fontFamily: "DM Mono, monospace",
          fontSize: 12,
          fontWeight: 500,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1.5,
          marginBottom: 14,
          display: "block",
        }}>
          {t("marketplace.eyebrow")}
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
          {t("marketplace.headingPart1")}
          {t("marketplace.headingHighlight")}
          {t("marketplace.headingPart2", "")}
        </h2>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 16,
          color: "#475569",
          margin: 0,
          lineHeight: 1.7,
        }}>
          {t("marketplace.subtitle")}
        </p>
      </div>

      {!loading && items.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 24px",
          borderRadius: 20,
          background: "#f6f7fb",
          border: "1px solid #e6e8f0",
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b6bcc9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px" }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#6b7280" }}>
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
              borderRadius: 20,
              background: "#eef0f4",
              border: "1px solid #e6e8f0",
              height: 380,
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div
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
              background: "#0b1220",
              border: "1px solid #0b1220",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {t("marketplace.viewAll")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
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
