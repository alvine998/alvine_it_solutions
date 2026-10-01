import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Locale = "en" | "id" | "zh";
type LocalizedText = Partial<Record<Locale, string>>;

interface PortfolioApp {
  _id: string;
  title: LocalizedText;
  category: LocalizedText;
  description: LocalizedText;
  problem: LocalizedText;
  solution: LocalizedText;
  timeline: LocalizedText;
  results: Partial<Record<Locale, string[]>>;
  tech: string[];
  image: string;
  liveUrl: string;
}

function localized(value: LocalizedText | undefined, locale: Locale): string {
  return value?.[locale]?.trim() || value?.en?.trim() || "";
}

function ProjectCard({ project, locale, t }: {
  project: PortfolioApp;
  locale: Locale;
  t: (key: string) => string;
}) {
  const title = localized(project.title, locale);
  const results = project.results?.[locale]?.length ? project.results[locale] : project.results?.en || [];
  const timeline = localized(project.timeline, locale);

  return (
    <article
      aria-label={title}
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
        {project.image ? (
          <img src={project.image} alt="" loading="lazy" decoding="async" width={800} height={450} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div aria-hidden style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,18,32,0.72) 0%, transparent 62%)" }} aria-hidden />
        {localized(project.category, locale) && <span style={{ position: "absolute", top: 14, left: 14, padding: "6px 13px", borderRadius: 50, background: "rgba(255,255,255,0.94)", border: "1px solid #e2e4ee", color: "#0b1220", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>{localized(project.category, locale)}</span>}
        {timeline && <span style={{ position: "absolute", top: 14, right: 14, padding: "6px 13px", borderRadius: 50, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", fontSize: 12, fontWeight: 600, fontFamily: "DM Mono, monospace" }}>{timeline}</span>}
        <h3 style={{ position: "absolute", bottom: 14, left: 20, right: 20, margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>{title}</h3>
      </div>

      <div style={{ padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        {localized(project.description, locale) && <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0 }}>{localized(project.description, locale)}</p>}
        <div style={{ display: "grid", gap: 10 }}>
          {localized(project.problem, locale) && <div><div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#be185d", marginBottom: 4 }}>{t("portfolio.problemLabel")}</div><p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#334155", lineHeight: 1.65 }}>{localized(project.problem, locale)}</p></div>}
          {localized(project.solution, locale) && <div><div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#4338ca", marginBottom: 4 }}>{t("portfolio.solutionLabel")}</div><p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#334155", lineHeight: 1.65 }}>{localized(project.solution, locale)}</p></div>}
        </div>
        {results.length > 0 && <div style={{ borderTop: "1px solid #eef0f4", paddingTop: 12 }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#6b7280", marginBottom: 8 }}>{t("portfolio.outcomeLabel")}</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
            {results.map((result) => <li key={result} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#0b1220", lineHeight: 1.5 }}><span aria-hidden style={{ color: "#047857", fontWeight: 700 }}>—</span>{result}</li>)}
          </ul>
        </div>}
        {project.tech.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto", paddingTop: 4 }}>
          {project.tech.map((technology) => <span key={technology} style={{ padding: "5px 12px", borderRadius: 50, background: "#f1f2f7", border: "1px solid #e2e4ee", color: "#3f4756", fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>{technology}</span>)}
        </div>}
        {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: 600, color: "#4f46e5", textDecoration: "none", marginTop: 4 }}>{t("portfolio.viewLive")} <span aria-hidden>→</span></a>}
      </div>
    </article>
  );
}

export default function Portfolio() {
  const { t, i18n } = useTranslation();
  const [apps, setApps] = useState<PortfolioApp[]>([]);
  const [loading, setLoading] = useState(true);
  const locale: Locale = i18n.resolvedLanguage?.startsWith("id") ? "id" : i18n.resolvedLanguage?.startsWith("zh") ? "zh" : "en";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portfolio-apps")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load portfolio apps");
        return response.json();
      })
      .then((data: { apps?: PortfolioApp[] }) => {
        if (!cancelled) setApps(Array.isArray(data.apps) ? data.apps : []);
      })
      .catch((error) => {
        console.error("Error fetching portfolio apps:", error);
        if (!cancelled) setApps([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="portfolio" aria-label={t("portfolio.eyebrow")} style={{ position: "relative", zIndex: 10, padding: "110px 24px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "left", marginBottom: 32, maxWidth: 700 }}>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, display: "block" }}>{t("portfolio.eyebrow")}</span>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 800, color: "#0b1220", lineHeight: 1.2, letterSpacing: "-1px", margin: "0 0 14px" }}>{t("portfolio.headingPart1")}{t("portfolio.headingHighlight")}{t("portfolio.headingPart2", "")}</h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#475569", margin: 0, lineHeight: 1.7 }}>{t("portfolio.sub")}</p>
      </div>

      {loading ? <p role="status" style={{ textAlign: "center", padding: 40, fontFamily: "Inter, sans-serif", color: "#6b7280" }}>{t("portfolio.loading")}</p> : apps.length > 0 ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 22, alignItems: "stretch" }}>
        {apps.map((project) => <ProjectCard key={project._id} project={project} locale={locale} t={t} />)}
      </div> : <p style={{ textAlign: "center", padding: 24, fontFamily: "Inter, sans-serif", color: "#6b7280" }}>{t("portfolio.empty")}</p>}

      {!loading && apps.length > 0 && <p style={{ textAlign: "center", marginTop: 28, fontFamily: "DM Mono, monospace", fontSize: 12.5, color: "#6b7280" }}>{t("portfolio.referencesNote")}</p>}
    </section>
  );
}
