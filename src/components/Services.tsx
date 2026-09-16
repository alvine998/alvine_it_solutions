import { useTranslation } from "react-i18next";

const serviceKeys = ["desktopApps", "websites", "restfulApi", "mobileApps"] as const;

const serviceIcons = [
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  ),
  (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
];

const serviceTechs = [
  ["Electron", "Tauri", ".NET", "SQLite"],
  ["React", "Next.js", "TypeScript", "Tailwind"],
  ["Laravel", "Node.js", "Go", "PostgreSQL"],
  ["React Native", "Flutter", "Swift", "Kotlin"],
];

function ServiceCard({ index, t }: { index: number; t: (key: string) => string }) {
  const key = serviceKeys[index];
  const techs = serviceTechs[index];

  return (
    <div
      style={{
        padding: 32,
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #e6e8f0",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: "#0b1220",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
          color: "#fff",
        }}
      >
        {serviceIcons[index]}
      </div>

      <h3 style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 21,
        fontWeight: 700,
        color: "#0b1220",
        margin: "0 0 10px",
      }}>
        {t(`services.${key}.title`)}
      </h3>

      <p style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 15,
        color: "#475569",
        lineHeight: 1.7,
        margin: "0 0 22px",
      }}>
        {t(`services.${key}.description`)}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {techs.map((tech) => (
          <span
            key={tech}
            style={{
              padding: "6px 14px",
              borderRadius: 50,
              background: "#f1f2f7",
              border: "1px solid #e2e4ee",
              color: "#3f4756",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Services() {
  const { t } = useTranslation();

  return (
    <section
      id="services"
      aria-label="Services"
      style={{
        position: "relative",
        zIndex: 10,
        padding: "110px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "left", marginBottom: 48, maxWidth: 680 }}>
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
          {t("services.eyebrow")}
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
          {t("services.headingPart1")}
          {t("services.headingHighlight")}
          {t("services.headingPart2", "")}
        </h2>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 16,
          color: "#475569",
          margin: 0,
          lineHeight: 1.7,
        }}>
          {t("services.sub", "")}
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
      }}>
        {serviceKeys.map((_, i) => (
          <ServiceCard key={i} index={i} t={t} />
        ))}
      </div>
    </section>
  );
}
