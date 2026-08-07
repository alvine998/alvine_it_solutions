import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "EN", native: "English" },
  { code: "id", label: "ID", native: "Indonesia" },
  { code: "zh", label: "中文", native: "中文" },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        border: "1px solid rgba(99, 102, 241, 0.35)",
        borderRadius: 8,
        overflow: "hidden",
        flexShrink: 0,
      }}
      aria-label={t("languageSwitcher.label")}
    >
      {languages.map((lang, i) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => i18n.changeLanguage(lang.code)}
          title={lang.native}
          style={{
            padding: "6px 12px",
            border: "none",
            borderRight: i < languages.length - 1 ? "1px solid rgba(99, 102, 241, 0.35)" : "none",
            cursor: "pointer",
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 12,
            fontWeight: 700,
            background: i18n.language === lang.code ? "#6366f1" : "transparent",
            color: i18n.language === lang.code ? "#fff" : "rgba(255, 255, 255, 0.5)",
            transition: "background 180ms ease, color 180ms ease",
            lineHeight: 1.4,
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
