import { useTranslation } from "react-i18next";

export default function Trust() {
  const { t } = useTranslation();
  const items = (t("trust.items", { returnObjects: true }) as unknown as { title: string; desc: string }[]) || [];

  return (
    <section aria-label="Trust and risk reducers" style={{ position: "relative", zIndex: 10, padding: "70px 24px 10px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{
        borderRadius: 20, padding: "44px 32px",
        background: "#f6f7fb",
        border: "1px solid #e6e8f0",
      }}>
        <div style={{ textAlign: "left", marginBottom: 32, maxWidth: 640 }}>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 12 }}>
            {t("trust.eyebrow")}
          </span>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, color: "#0b1220", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            {t("trust.headingPart1")}
            {t("trust.headingHighlight")}
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#475569", margin: 0, lineHeight: 1.7 }}>
            {t("trust.sub")}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
          {items.map((item) => (
            <div
              key={item.title}
              style={{ padding: "20px 18px", borderRadius: 14, background: "#ffffff", border: "1px solid #e6e8f0" }}
            >
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14.5, fontWeight: 700, color: "#0b1220", marginBottom: 8 }}>{item.title}</div>
              <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#475569", lineHeight: 1.65 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <a href="#contact" style={{
            textDecoration: "none", padding: "13px 30px", borderRadius: 50,
            background: "#0b1220", color: "#fff",
            fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
          }}>
            {t("trust.cta")} →
          </a>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#6b7280" }}>
            {t("trust.profiles")}
          </span>
        </div>
      </div>
    </section>
  );
}
