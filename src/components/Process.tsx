import { useTranslation } from "react-i18next";

export default function Process() {
  const { t } = useTranslation();
  const steps = (t("process.steps", { returnObjects: true }) as unknown as { title: string; desc: string }[]) || [];

  return (
    <section id="process" aria-label="Development process" style={{ position: "relative", zIndex: 10, padding: "90px 24px 30px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "left", marginBottom: 40, maxWidth: 680 }}>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1.5, display: "block", marginBottom: 14 }}>
          {t("process.eyebrow")}
        </span>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 800, color: "#0b1220", letterSpacing: "-1px", margin: "0 0 14px", lineHeight: 1.2 }}>
          {t("process.headingPart1")}
          {t("process.headingHighlight")}
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#475569", margin: 0, lineHeight: 1.7 }}>
          {t("process.sub")}
        </p>
      </div>

      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {steps.map((s, i) => (
          <li
            key={s.title}
            style={{
              padding: "24px 20px", borderRadius: 16,
              background: "#ffffff", border: "1px solid #e6e8f0",
            }}
          >
            <div aria-hidden style={{
              width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center",
              background: i === 0 ? "#0b1220" : "#f1f2f7",
              border: "1px solid #e2e4ee",
              fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 13,
              color: i === 0 ? "#fff" : "#334155",
              marginBottom: 14,
            }}>
              {i + 1}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, color: "#0b1220", marginBottom: 8, lineHeight: 1.4 }}>
              {s.title}
            </div>
            <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#475569", lineHeight: 1.65 }}>
              {s.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
