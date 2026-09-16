import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface Plan {
  _id: string;
  name: string;
  price: number;
  credits: number;
  duration_days: number;
  features: string[];
  status: "active" | "inactive";
}

// legacy fallback (used only when the API is unreachable)
type PlanKey = "starter" | "pro" | "platinum";
const LEGACY_PLAN_KEYS: PlanKey[] = ["starter", "pro", "platinum"];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c3c9d6" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function Pricing() {
  const { t } = useTranslation();
  const [authed, setAuthed] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const check = () => setAuthed(!!localStorage.getItem("token") && !!(localStorage.getItem("user") || localStorage.getItem("router_customer")));
    check();
    window.addEventListener("storage", check);
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);
    return () => { window.removeEventListener("storage", check); window.removeEventListener("focus", onFocus); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/plans?status=active&limit=100")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setPlans((data.plans || []) as Plan[]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // pick a legacy fallback plan set only when the API is unreachable
  const cards: (Plan & { popular?: boolean })[] =
    plans.length > 0
      ? plans
          .slice()
          .sort((a, b) => a.price - b.price)
          .map((p, i, arr) => ({ ...p, popular: arr.length > 1 && i === Math.min(1, arr.length - 2) }))
      : loaded
        ? []
        : LEGACY_PLAN_KEYS.map((k, i) => ({
            _id: k,
            name: t(`pricing.plans.${k}.name`),
            price: parseInt(t(`pricing.plans.${k}.price`).replace(/[^\d]/g, "") || "0", 10),
            credits: parseInt(t(`pricing.plans.${k}.credits`).replace(/[^\d]/g, "") || "0", 10),
            duration_days: 30,
            features: t(`pricing.plans.${k}.features`, { returnObjects: true }) as unknown as string[],
            status: "active",
            popular: i === 1,
          }));

  return (
    <section
      id="pricing"
      style={{
        position: "relative",
        zIndex: 10,
        padding: "120px 24px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div
        style={{ textAlign: "left", marginBottom: 48, maxWidth: 680 }}
      >
        <span style={{
          fontFamily: "DM Mono, monospace",
          fontSize: 12, fontWeight: 500, color: "#6b7280",
          textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, display: "block",
        }}>
          {t("pricing.eyebrow")}
        </span>
        <h2 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "clamp(30px, 4.5vw, 46px)", fontWeight: 800, color: "#0b1220",
          lineHeight: 1.15, letterSpacing: "-1px", margin: "0 0 14px",
        }}>
          {t("pricing.headingPart1")}
          {t("pricing.headingHighlight")}
          {t("pricing.headingPart2")}
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#475569", margin: 0, lineHeight: 1.7 }}>
          {t("pricing.subtitle")}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, alignItems: "stretch" }} className="pricing-grid">
        {cards.map((plan) => {
          const metaPopular = plan.popular;
          const features: string[] = plan.features;
          const cta = t("pricing.ctaDefault");

          return (
            <div
              key={plan._id}
              style={{
                position: "relative",
                padding: "36px 28px 28px",
                borderRadius: 16,
                background: "#ffffff",
                border: metaPopular ? "2px solid #0b1220" : "1px solid #e6e8f0",
                display: "flex", flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {metaPopular && (
                <div style={{
                  position: "absolute", top: 16, right: 16,
                  padding: "5px 12px", borderRadius: 50,
                  background: "#0b1220",
                  color: "#fff", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: 0.5, textTransform: "uppercase",
                }}>
                  {t("pricing.mostPopular")}
                </div>
              )}

              <div style={{ position: "relative" }}>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 700, color: "#0b1220", marginBottom: 6 }}>
                  {plan.name}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 20, minHeight: 38 }}>
                  {t("pricing.planDesc", { credits: plan.credits.toLocaleString("id-ID") })}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 40, fontWeight: 800, color: "#0b1220", letterSpacing: "-1.5px" }}>
                    IDR {plan.price.toLocaleString("id-ID")}
                  </span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6b7280" }}>
                    / {plan.duration_days} days
                  </span>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 50,
                  background: "#eef0ff",
                  border: "1px solid #c9cdfc",
                  fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 600,
                  color: "#4338ca",
                  marginBottom: 20,
                }}>
                  {plan.credits.toLocaleString("id-ID")} {t("pricing.creditsLabel")}
                </div>

                <Link
                  to={authed ? `/dashboard/billing?plan=${plan._id}` : `/auth?plan=${plan._id}&mode=register`}
                  style={{
                    display: "block", textAlign: "center", textDecoration: "none",
                    padding: "13px 20px", borderRadius: 50,
                    fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                    background: "#0b1220",
                    color: "#fff",
                    border: "none",
                    marginBottom: 24,
                  }}
                >
                  {cta}
                </Link>

                <div style={{ borderTop: "1px solid #eef0f4", paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  {features.length === 0 ? (
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: "#94a3b8" }}>
                      {t("pricing.noFeatures")}
                    </div>
                  ) : (
                    features.map((f, idx) => {
                      const isDisabled = f.startsWith("!");
                      const label = isDisabled ? f.slice(1) : f;
                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontFamily: "Inter, sans-serif", fontSize: 13.5, color: isDisabled ? "#b6bcc9" : "#334155", lineHeight: 1.5 }}>
                          <span style={{ marginTop: 1, flexShrink: 0 }}>{isDisabled ? <CrossIcon /> : <CheckIcon />}</span>
                          <span style={{ textDecoration: isDisabled ? "line-through" : "none" }}>{label}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: "24px 28px",
          borderRadius: 16,
          background: "#f6f7fb",
          border: "1px solid #e6e8f0",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 20,
          alignItems: "center",
        }}
        className="pricing-referral"
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            flexShrink: 0,
            background: "#0b1220",
            display: "grid",
            placeItems: "center",
            color: "#fff",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1.2, color: "#047857", fontWeight: 700 }}>{t("pricing.referral.eyebrow")}</span>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 800, color: "#0b1220" }}>{t("pricing.referral.title")}</span>
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, lineHeight: 1.7, color: "#475569" }}>
            {t("pricing.referral.desc")}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, fontFamily: "DM Mono, monospace", fontSize: 11.5 }}>
            {(["step1", "step2", "step3"] as const).map((k, i) => (
              <span key={k} style={{ padding: "6px 11px", borderRadius: 20, background: "#ffffff", border: "1px solid #e2e4ee", color: "#334155" }}>
                {i + 1}. {t(`pricing.referral.${k}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:640px){ .pricing-referral{ grid-template-columns: 1fr !important; text-align: center; } .pricing-referral > div:first-child{ margin: 0 auto; } }`}</style>

      <div
        style={{
          marginTop: 32, textAlign: "center",
          padding: "18px 24px", borderRadius: 16,
          background: "#f6f7fb", border: "1px solid #e6e8f0",
          fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6b7280", lineHeight: 1.7,
        }}
      >
        {t("pricing.footnote")} <a href="#contact" style={{ color: "#0b1220", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>{t("pricing.footnoteLink")}</a>
      </div>
    </section>
  );
}
