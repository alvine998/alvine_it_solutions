import { useState } from "react";
import { useTranslation } from "react-i18next";
import { submitContact } from "../lib/api";
import { SITE } from "../lib/site";

export default function Contact() {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    budget: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      await submitContact(formData);
      setSubmitStatus("success");
      setFormData({ name: "", email: "", phone: "", company: "", budget: "", message: "" });
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      style={{
        position: "relative",
        zIndex: 10,
        padding: "110px 24px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
        <div
          className="contact-inner"
          style={{
            textAlign: "center",
            padding: "64px 48px",
            borderRadius: 20,
            background: "#ffffff",
            border: "1px solid #e6e8f0",
            position: "relative",
            overflow: "hidden",
          }}
        >

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              aria-hidden
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "#0b1220",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 28px",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>

            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: "#0b1220",
              lineHeight: 1.2,
              letterSpacing: "-1px",
              margin: "0 0 14px",
            }}>
              {t("contact.headingPart1")}
              {t("contact.headingHighlight")}
              {t("contact.headingPart2", "")}
            </h2>

            <p style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 17,
              color: "#475569",
              lineHeight: 1.7,
              maxWidth: 520,
              margin: "0 auto 14px",
            }}>
              {t("contact.subtitle")}
            </p>

            <p style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 12.5,
              color: "#047857",
              margin: "0 auto 24px",
              lineHeight: 1.6,
            }}>
              {t("contact.timezoneNote")}
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
              <a href={SITE.calendly} target="_blank" rel="noopener noreferrer" style={{
                textDecoration: "none", padding: "13px 26px", borderRadius: 50,
                background: "#4f46e5", color: "#fff",
                fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                {t("contact.bookCall", "Book via Calendly")}
              </a>
              <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" style={{
                textDecoration: "none", padding: "13px 26px", borderRadius: 50,
                background: "#ffffff", color: "#0b1220",
                fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                border: "1px solid #d4d7e3",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                {t("contact.whatsapp", "Chat via WhatsApp")}
              </a>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: "0 auto" }} aria-label="Contact form">
              <div style={{ display: "grid", gap: 14, marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <label style={{ display: "grid", gap: 6, textAlign: "left" }}>
                    <span className="sr-only">{t("contact.namePlaceholder")}</span>
                    <input
                      type="text"
                      aria-label={t("contact.namePlaceholder")}
                      placeholder={t("contact.namePlaceholder")}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      autoComplete="name"
                      style={{
                        padding: "14px 18px",
                        borderRadius: 12,
                        border: "1px solid #d4d7e3",
                        background: "#ffffff",
                        color: "#0b1220",
                        fontSize: 15,
                        fontFamily: "Inter, sans-serif",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6, textAlign: "left" }}>
                    <span className="sr-only">{t("contact.emailPlaceholder")}</span>
                    <input
                      type="email"
                      aria-label={t("contact.emailPlaceholder")}
                      placeholder={t("contact.emailPlaceholder")}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      autoComplete="email"
                      style={{
                        padding: "14px 18px",
                        borderRadius: 12,
                        border: "1px solid #d4d7e3",
                        background: "#ffffff",
                        color: "#0b1220",
                        fontSize: 15,
                        fontFamily: "Inter, sans-serif",
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <input
                    type="tel"
                    aria-label={t("contact.phonePlaceholder")}
                    placeholder={t("contact.phonePlaceholder")}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    autoComplete="tel"
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      border: "1px solid #d4d7e3",
                      background: "#ffffff",
                      color: "#0b1220",
                      fontSize: 15,
                      fontFamily: "Inter, sans-serif",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                  <input
                    type="text"
                    aria-label={t("contact.companyPlaceholder")}
                    placeholder={t("contact.companyPlaceholder")}
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    autoComplete="organization"
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      border: "1px solid #d4d7e3",
                      background: "#ffffff",
                      color: "#0b1220",
                      fontSize: 15,
                      fontFamily: "Inter, sans-serif",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <input
                  type="text"
                  aria-label={t("contact.budgetPlaceholder", "Budget range")}
                  placeholder={t("contact.budgetPlaceholder", "Budget range (e.g. $3k–$5k)")}
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 12,
                    border: "1px solid #d4d7e3",
                    background: "#ffffff",
                    color: "#0b1220",
                    fontSize: 15,
                    fontFamily: "Inter, sans-serif",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                <textarea
                  aria-label={t("contact.messagePlaceholder")}
                  placeholder={t("contact.messagePlaceholder")}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 12,
                    border: "1px solid #d4d7e3",
                    background: "#ffffff",
                    color: "#0b1220",
                    fontSize: 15,
                    fontFamily: "Inter, sans-serif",
                    outline: "none",
                    resize: "vertical",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "16px 40px",
                  borderRadius: 12,
                  background: "#0b1220",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  border: "1px solid #0b1220",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? t("contact.submitting") : t("contact.submit")}
              </button>
              {submitStatus === "success" && (
                <p role="status" style={{ color: "#047857", marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>
                  {t("contact.success")}
                </p>
              )}
              {submitStatus === "error" && (
                <p role="alert" style={{ color: "#dc2626", marginTop: 16, fontSize: 14, lineHeight: 1.6 }}>
                  {t("contact.error")}
                </p>
              )}
              <p style={{ marginTop: 20, fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
                {t("contact.directLabel")}
              </p>
            </form>
          </div>
        </div>
    </section>
  );
}
