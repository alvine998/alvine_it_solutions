import { useTranslation } from "react-i18next";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";
import { FALLBACK_ROUTER_BASE } from "../../lib/routerBaseUrl";

export default function Documentation() {
  const { t } = useTranslation();
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const base = FALLBACK_ROUTER_BASE;

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.03)";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const accent = "#6366f1";

  const sections = [
    { title: t("customer.documentation.overviewTitle"), body: t("customer.documentation.overview") },
    { title: t("customer.documentation.creditsTitle"), body: t("customer.documentation.credits") },
    { title: t("customer.documentation.autoTitle"), body: t("customer.documentation.auto") },
    { title: t("customer.documentation.authTitle"), body: t("customer.documentation.auth") },
    { title: t("customer.documentation.fallbackTitle"), body: t("customer.documentation.fallback") },
  ];

  return (
    <div style={{ display: "grid", gap: 18, color: fg }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 800, color: fg }}>{t("customer.documentation.title")}</h2>
        <p style={{ margin: "6px 0 0", color: muted, fontSize: 13.5, lineHeight: 1.7, maxWidth: 720 }}>{t("customer.documentation.subtitle")}</p>
      </div>

      <div
        style={{
          borderRadius: 12, border: `1px solid ${border}`, background: isLight ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.03)",
          padding: 14, fontFamily: "DM Mono, monospace", fontSize: 12, lineHeight: 1.7, color: muted,
        }}
      >
        <div style={{ color: accent, letterSpacing: 0.6, fontSize: 11, marginBottom: 6 }}>{t("customer.docs.endpoint")}</div>
        <code style={{ color: isLight ? "#1c1917" : "#e0e7ff", wordBreak: "break-all" }}>{base}/chat/completions</code>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {sections.map((s) => (
          <section
            key={s.title}
            style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardBg, padding: 18, boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}
          >
            <h3 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 15, fontWeight: 700, color: fg }}>{s.title}</h3>
            <p style={{ margin: "10px 0 0", color: muted, fontSize: 13.5, lineHeight: 1.75 }}>{s.body}</p>
          </section>
        ))}
      </div>

      <style>{`@media(max-width: 860px){ .docs-section-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
