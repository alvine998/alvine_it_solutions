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
        border: "1px solid #dfe2ee",
        borderRadius: 8,
        overflow: "hidden",
        flexShrink: 0,
        background: "#fff",
      }}
      aria-label={t("languageSwitcher.label")}
    >
      {languages.map((lang, i) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => i18n.changeLanguage(lang.code)}
          title={lang.native}
          aria-pressed={i18n.language === lang.code}
          style={{
            padding: "6px 12px",
            border: "none",
            borderRight: i < languages.length - 1 ? "1px solid #dfe2ee" : "none",
            cursor: "pointer",
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 12,
            fontWeight: 700,
            background: i18n.language === lang.code ? "#4f46e5" : "transparent",
            color: i18n.language === lang.code ? "#fff" : "#6b7280",
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
