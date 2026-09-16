import { useTranslation } from "react-i18next";

const statKeys = ["projects", "clients", "experience", "support"] as const;
const statValues = ["100+", "50+", "5+", "24/7"];

const techStack = [
  "React Native", "Next.js", "TypeScript", "Laravel", "Node.js", "Go",
  "Flutter", "PostgreSQL", "MySQL", "Redis", "Docker", "AWS",
];

export default function About() {
  const { t } = useTranslation();

  return (
    <section
      id="about"
      style={{
        position: "relative",
        zIndex: 10,
        padding: "110px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }} className="about-grid">
        <div>
          <span
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 12,
              fontWeight: 500,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 14,
              display: "block",
            }}
          >
            {t("about.eyebrow")}
          </span>

          <h2
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "clamp(30px, 4vw, 44px)",
              fontWeight: 800,
              color: "#0b1220",
              lineHeight: 1.2,
              letterSpacing: "-1px",
              margin: "0 0 22px",
            }}
          >
            {t("about.headingPart1")}
            {t("about.headingHighlight")}
            {t("about.headingPart2", "")}
          </h2>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              color: "#475569",
              lineHeight: 1.8,
              margin: "0 0 20px",
            }}
          >
            {t("about.paragraph1")}
          </p>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              color: "#475569",
              lineHeight: 1.8,
              margin: "0 0 32px",
            }}
          >
            {t("about.paragraph2")}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {techStack.map((tech) => (
              <span
                key={tech}
                style={{
                  padding: "8px 18px",
                  borderRadius: 50,
                  background: "#f1f2f7",
                  border: "1px solid #e2e4ee",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {statKeys.map((key, i) => (
              <div
                key={key}
                style={{
                  padding: 32,
                  borderRadius: 16,
                  background: "#ffffff",
                  border: "1px solid #e6e8f0",
                  textAlign: "center",
                }}
              >
                <div style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 38,
                  fontWeight: 800,
                  color: "#0b1220",
                  marginBottom: 8,
                }}>
                  {statValues[i]}
                </div>
                <div style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  color: "#6b7280",
                  fontWeight: 500,
                }}>
                  {t(`about.stats.${key}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
