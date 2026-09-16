import { useTranslation } from "react-i18next";

type ProjectData = {
  tech: string[];
  image: string;
  link: string;
};

const projectData: Record<string, ProjectData> = {
  goldbricks: {
    tech: ["Laravel", "MySQL"],
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop&q=70&auto=format",
    link: "https://goldbricks.co.id",
  },
  stokinventory: {
    tech: ["Laravel", "MySQL"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=70&auto=format",
    link: "https://stokinventory.com",
  },
  kerjaAjaDulu: {
    tech: ["Next.js", "Express.js", "MySQL"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&q=70&auto=format",
    link: "https://kerjaajadulu.com",
  },
  kasirinApp: {
    tech: ["React Native", "TypeScript", "SQLite"],
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop&q=70&auto=format",
    link: "https://play.google.com/store/apps/details?id=com.kasirinku.app&hl=id",
  },
  tokotitohApp: {
    tech: ["Node.js", "PostgreSQL", "Redis"],
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop&q=70&auto=format",
    link: "https://play.google.com/store/apps/details?id=com.tokonyang_app&hl=id",
  },
  midlandProperti: {
    tech: ["React", "Python", "Docker"],
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=450&fit=crop&q=70&auto=format",
    link: "https://midlandproperti.id/",
  },
  bmTransportLogistik: {
    tech: ["Flutter", "Go", "Firebase"],
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=450&fit=crop&q=70&auto=format",
    link: "https://bmtransportlogistik.com",
  },
};

const ALL_PROJECT_KEYS = Object.keys(projectData);

function ProjectCard({ projectKey }: { projectKey: string }) {
  const { t } = useTranslation();
  const p = projectData[projectKey];
  const results = (t(`portfolio.projects.${projectKey}.results`, { returnObjects: true }) as unknown as string[]) || [];
  const timeline = t(`portfolio.projects.${projectKey}.timeline`, { defaultValue: "" });

  return (
    <article
      aria-label={t(`portfolio.projects.${projectKey}.title`)}
      style={{
        position: "relative",
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #e6e8f0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden", height: 210 }}>
        <img
          src={p.image}
          alt=""
          loading="lazy"
          decoding="async"
          width={800}
          height={450}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(11,18,32,0.72) 0%, transparent 62%)",
        }} aria-hidden />
        <span style={{
          position: "absolute", top: 14, left: 14,
          padding: "6px 13px", borderRadius: 50,
          background: "rgba(255,255,255,0.94)",
          border: "1px solid #e2e4ee",
          color: "#0b1220", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
        }}>
          {t(`portfolio.projects.${projectKey}.category`)}
        </span>
        {timeline && (
          <span style={{
            position: "absolute", top: 14, right: 14,
            padding: "6px 13px", borderRadius: 50,
            background: "#ecfdf5", border: "1px solid #a7f3d0",
            color: "#047857", fontSize: 12, fontWeight: 600, fontFamily: "DM Mono, monospace",
          }}>
            {timeline}
          </span>
        )}
        <h3 style={{
          position: "absolute", bottom: 14, left: 20, right: 20, margin: 0,
          fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: "#fff",
          textShadow: "0 1px 8px rgba(0,0,0,0.35)",
        }}>
          {t(`portfolio.projects.${projectKey}.title`)}
        </h3>
      </div>

      <div style={{ padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0 }}>
          {t(`portfolio.projects.${projectKey}.description`)}
        </p>

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#be185d", marginBottom: 4 }}>
              {t("portfolio.problemLabel")}
            </div>
            <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#334155", lineHeight: 1.65 }}>
              {t(`portfolio.projects.${projectKey}.problem`)}
            </p>
          </div>
          <div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#4338ca", marginBottom: 4 }}>
              {t("portfolio.solutionLabel")}
            </div>
            <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#334155", lineHeight: 1.65 }}>
              {t(`portfolio.projects.${projectKey}.solution`)}
            </p>
          </div>
        </div>

        {Array.isArray(results) && results.length > 0 && (
          <div style={{
            borderTop: "1px solid #eef0f4",
            paddingTop: 12,
          }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>
              {t("portfolio.outcomeLabel")}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
              {results.map((r) => (
                <li key={r} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#0b1220", lineHeight: 1.5 }}>
                  <span aria-hidden style={{ color: "#047857", fontWeight: 700 }}>—</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto", paddingTop: 4 }}>
          {p.tech.map((tech) => (
            <span key={tech} style={{
              padding: "5px 12px", borderRadius: 50,
              background: "#f1f2f7", border: "1px solid #e2e4ee",
              color: "#3f4756", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif",
            }}>
              {tech}
            </span>
          ))}
        </div>

        {p.link && p.link !== "#" && (
          <a
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: 600,
              color: "#4f46e5", textDecoration: "none", marginTop: 4,
            }}
          >
            View live <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </article>
  );
}

export default function Portfolio() {
  const { t } = useTranslation();

  return (
    <section id="portfolio" aria-label="Case studies" style={{ position: "relative", zIndex: 10, padding: "110px 24px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "left", marginBottom: 32, maxWidth: 700 }}>
        <span style={{
          fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500, color: "#6b7280",
          textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, display: "block",
        }}>
          {t("portfolio.eyebrow")}
        </span>
        <h2 style={{
          fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(30px, 4.5vw, 46px)",
          fontWeight: 800, color: "#0b1220", lineHeight: 1.2, letterSpacing: "-1px", margin: "0 0 14px",
        }}>
          {t("portfolio.headingPart1")}
          {t("portfolio.headingHighlight")}
          {t("portfolio.headingPart2", "")}
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#475569", margin: 0, lineHeight: 1.7 }}>
          {t("portfolio.sub")}
        </p>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
        gap: 22, alignItems: "stretch",
      }}>
        {ALL_PROJECT_KEYS.map((key) => (
          <ProjectCard key={key} projectKey={key} />
        ))}
      </div>

      <p style={{
        textAlign: "center", marginTop: 28,
        fontFamily: "DM Mono, monospace", fontSize: 12.5, color: "#6b7280",
      }}>
        {t("portfolio.referencesNote")}
      </p>
    </section>
  );
}
