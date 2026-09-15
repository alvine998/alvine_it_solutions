import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { submitContact } from "../lib/api";
import { SITE } from "../lib/site";

export default function Contact() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

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
      ref={sectionRef}
      style={{
        position: "relative",
        zIndex: 10,
        padding: "120px 24px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <motion.div
        style={reduceMotion ? undefined : { y }}
      >
        <motion.div
          className="contact-inner"
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            textAlign: "center",
            padding: "72px 48px",
            borderRadius: 28,
            background: "#ffffff",
            border: "1px solid #e6e8f0",
            boxShadow: "0 2px 4px rgba(16,24,40,0.05), 0 24px 60px rgba(16,24,40,0.1)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute",
            top: "-40%",
            left: "-20%",
            width: "140%",
            height: "80%",
            background: "radial-gradient(closest-side, rgba(79,70,229,0.08), transparent)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring" }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 32px",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>

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
              <span style={{ color: "#4f46e5" }}>
                {t("contact.headingHighlight")}
              </span>
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
                boxShadow: "0 6px 18px rgba(79,70,229,0.28)",
              }}>
                📅 {t("contact.bookCall", "Book via Calendly")}
              </a>
              <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" style={{
                textDecoration: "none", padding: "13px 26px", borderRadius: 50,
                background: "#ffffff", color: "#0b1220",
                fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                border: "1px solid #bbf7d0",
                boxShadow: "0 1px 2px rgba(16,24,40,0.06)",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                💬 {t("contact.whatsapp", "Chat via WhatsApp")}
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
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
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
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "Inter, sans-serif",
                    outline: "none",
                    resize: "vertical",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={reduceMotion ? undefined : { scale: 1.02, boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)" }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                style={{
                  width: "100%",
                  padding: "16px 40px",
                  borderRadius: 12,
                  background: "#4f46e5",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  border: "1px solid #4f46e5",
                  boxShadow: "0 6px 20px rgba(79,70,229,0.28)",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? t("contact.submitting") : t("contact.submit")}
              </motion.button>
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
        </motion.div>
      </motion.div>
    </section>
  );
}
