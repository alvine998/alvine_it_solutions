import { useState, useEffect, useId } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FALLBACK_ROUTER_BASE } from "../lib/routerBaseUrl";

type Mode = "login" | "register";
type PlanKey = "starter" | "pro" | "platinum";

interface PlanOption {
  _id: string;
  name: string;
  price: number;
  credits: number;
  duration_days: number;
  features: string[];
  status: "active" | "inactive";
}

const PLAN_DATA: Record<PlanKey, { credits: string; price: string; per: string }> = {
  starter: { credits: "500", price: "$2", per: "/ month" },
  pro: { credits: "3,500", price: "$10", per: "/ month" },
  platinum: { credits: "12,000", price: "$29", per: "/ month" },
};

const LEGACY_PLAN_KEYS = ["starter", "pro", "platinum"] as const;

export default function Auth() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const nameId = useId();
  const emailId = useId();
  const pwId = useId();

  const initialMode: Mode =
    (sp.get("mode") as Mode) === "login" ? "login" : (sp.get("mode") as Mode) === "register" ? "register" : "register";
  const rawPlan = sp.get("plan") ?? "";
  const legacyPlan: PlanKey | null =
    (LEGACY_PLAN_KEYS as readonly string[]).includes(rawPlan) ? (rawPlan as PlanKey) : null;
  const planId = legacyPlan ? null : rawPlan || null;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiPlans, setApiPlans] = useState<PlanOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);

  useEffect(() => setMode(initialMode), [initialMode]);

  // load active plans from /api/plans (public endpoint) for the picker + id-based plan slip
  useEffect(() => {
    let cancelled = false;
    fetch("/api/plans?status=active&limit=100")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const list: PlanOption[] = data.plans || [];
        setApiPlans(list);
        if (planId) {
          const found = list.find((p) => p._id === planId);
          if (found) setSelectedPlan(found);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [planId]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setErr("");
    const qs = new URLSearchParams(sp.toString());
    qs.set("mode", next);
    navigate(`/auth?${qs.toString()}`, { replace: true });
  };

  // fixed: auth now goes to router_customer (server/routes/routerCustomer.ts /auth/*)
  // VPS override still supported: set VITE_ROUTER_CUSTOMER_URL=https://router-host
  const ROUTER_BASE = (import.meta.env.VITE_ROUTER_CUSTOMER_URL as string | undefined)?.replace(/\/+$/, "") || "";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/api/router-customers/auth/login" : "/api/router-customers/auth/register";
      const url = ROUTER_BASE ? `${ROUTER_BASE}${path}` : path;
      const body = mode === "login" ? { email, password } : { name, email, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text || "Failed" }; }
      if (!res.ok) throw new Error(data.error || res.statusText || "Failed");
      const user = data.user ?? data.router_customer;
      if (!data.token || !user) throw new Error("Invalid auth response");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("router_customer", JSON.stringify(user));
      const chosenPlanLabel = legacyPlan ?? selectedPlan?.name ?? null;
      if (chosenPlanLabel) localStorage.setItem("selectedPlan", chosenPlanLabel);
      navigate("/dashboard");
    } catch (e: any) {
      setErr(e.message || t("auth.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const planName = legacyPlan ? t(`pricing.plans.${legacyPlan}.name`) : selectedPlan?.name ?? "";
  const activePlan: PlanKey | null = legacyPlan;
  const isZh = i18n.language === "zh";
  const isId = i18n.language === "id";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a14",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* technical grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: [
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            "radial-gradient(800px 400px at 20% 0%, rgba(99,102,241,0.16), transparent 60%)",
            "radial-gradient(600px 300px at 90% 90%, rgba(6,182,214,0.09), transparent 60%)",
          ].join(", "),
          backgroundSize: "32px 32px, 32px 32px, auto, auto",
          maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* top hairline nav */}
      <header
        style={{
          position: "relative",
          maxWidth: 1040,
          margin: "0 auto",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontFamily: "DM Mono, monospace",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            A
          </span>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "-0.2px", color: "#fff" }}>
            ALVINE IT SOLUTIONS
          </span>
        </Link>
        <Link to="/" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(255,255,255,0.55)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.09)", padding: "7px 12px", borderRadius: 20 }}>
          ← {t("auth.backToSite")}
        </Link>
      </header>

      <main
        style={{
          position: "relative",
          maxWidth: 1040,
          margin: "0 auto",
          padding: "32px 24px 48px",
          display: "grid",
          gridTemplateColumns: "1fr 440px",
          gap: 40,
          alignItems: "start",
        }}
        className="auth-layout"
      >
        {/* Left: provisioning context — the "designed" half */}
        <div style={{ paddingTop: 8 }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 1.6, color: "#06b6d4", marginBottom: 14 }}>
            AI ROUTER — {mode === "register" ? "PROVISION" : "ACCESS"}
          </div>

          <h1
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "clamp(28px, 4vw, 38px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-1px",
              color: "#fff",
              margin: "0 0 12px",
            }}
          >
            {mode === "register" ? (
              <>
                {isZh ? "为 " : isId ? "Buat akses untuk " : "Create access for "}
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #6366f1, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  auto
                </span>
                {isZh ? " 创建访问权限" : isId ? "" : "."}
              </>
            ) : (
              <>
                {isZh ? "登录到 " : isId ? "Masuk ke " : "Sign in to "}
                <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, background: "linear-gradient(135deg, #6366f1, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  auto
                </span>
                {isZh ? "" : isId ? "" : "."}
              </>
            )}
          </h1>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,0.58)", maxWidth: 520, margin: "0 0 24px" }}>
            {mode === "register" ? t("auth.registerSubtitle") : t("auth.loginSubtitle")}
          </p>

          {/* plan slip — looks like a ledger receipt, not a SaaS card */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: "rgba(255,255,255,0.45)" }}>
                {t("auth.slipTitle")}
              </span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}># {activePlan ? activePlan.toUpperCase() : selectedPlan ? selectedPlan._id.slice(-6).toUpperCase() : "—"}</span>
            </div>

            {activePlan || selectedPlan ? (
              <div style={{ padding: "16px 16px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>{planName}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    {activePlan
                      ? `${PLAN_DATA[activePlan].credits} credits`
                      : `${(selectedPlan?.credits ?? 0).toLocaleString("id-ID")} credits`}
                  </span>
                </div>

                <div style={{ display: "grid", gap: 8, fontFamily: "DM Mono, monospace", fontSize: 12, lineHeight: 1.6 }}>
                  {[
                    [t("auth.slipModel"), "auto"],
                    [
                      t("auth.slipPrice"),
                      activePlan
                        ? `${PLAN_DATA[activePlan].price} ${PLAN_DATA[activePlan].per}`
                        : `IDR ${(selectedPlan?.price ?? 0).toLocaleString("id-ID")} / ${selectedPlan?.duration_days ?? 30} days`,
                    ],
                    [t("auth.slipBilling"), t("auth.slipBillingValue")],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.07)", paddingBottom: 6 }}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                      <span style={{ color: "#fff" }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }} />
                  {t("auth.slipNote")}
                </div>
              </div>
            ) : (
              <div style={{ padding: 16, display: "grid", gap: 8 }}>
                {(apiPlans.length > 0 ? apiPlans : LEGACY_PLAN_KEYS.map((k) => ({ _id: k, name: t(`pricing.plans.${k}.name`), price: 0, credits: parseInt(PLAN_DATA[k].credits.replace(/,/g, ""), 10), duration_days: 30, features: [], status: "active" as const }))).map((p) => (
                  <Link
                    key={p._id}
                    to={`/auth?plan=${p._id}&mode=${mode}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.02)",
                      textDecoration: "none",
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "DM Mono, monospace",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "#fff", fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>
                      {apiPlans.length > 0
                        ? `${p.credits.toLocaleString("id-ID")} · IDR ${p.price.toLocaleString("id-ID")}`
                        : `${PLAN_DATA[p._id as PlanKey].credits} · ${PLAN_DATA[p._id as PlanKey].price}`}
                    </span>
                  </Link>
                ))}
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{t("auth.pickPlanHint")}</div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(16,185,129,0.06)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#10b981", marginTop: 1 }}>✓</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, lineHeight: 1.6, color: "rgba(255,255,255,0.6)" }}>{t("auth.trustLine")}</span>
          </div>

          {/* small spec */}
          <div style={{ marginTop: 22, display: "flex", gap: 16, flexWrap: "wrap", fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(255,255,255,0.32)" }}>
            <span>baseURL → {FALLBACK_ROUTER_BASE.replace(/^https?:\/\//, "")}</span>
            <span>·</span>
            <span>model: auto</span>
            <span>·</span>
            <span>credits billed per 1k tokens</span>
          </div>
        </div>

        {/* Right: form — quiet, high-contrast, not glassmorphism soup */}
        <div
          style={{
            background: "#f8f7f5",
            border: "1px solid #e7e5e4",
            borderRadius: 16,
            padding: 24,
            color: "#1c1917",
          }}
        >
          {/* mode as underline tabs, not pill */}
          <div style={{ display: "flex", gap: 20, borderBottom: "1px solid #e7e5e4", marginBottom: 22 }}>
            {(["register", "login"] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  aria-pressed={active}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: active ? "2px solid #0a0a14" : "2px solid transparent",
                    padding: "10px 2px 10px",
                    marginBottom: -1,
                    cursor: "pointer",
                    fontFamily: "Space Grotesk, sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: 0.2,
                    color: active ? "#0a0a14" : "rgba(28,25,23,0.45)",
                  }}
                >
                  {m === "login" ? t("auth.tabLogin") : t("auth.tabRegister")}
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} noValidate>
            <div style={{ display: "grid", gap: 14, marginBottom: 16 }}>
              {mode === "register" && (
                <div>
                  <label htmlFor={nameId} style={{ display: "block", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: "#57534e", marginBottom: 6 }}>
                    {t("auth.nameLabel").toUpperCase()}
                  </label>
                  <input
                    id={nameId}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.namePlaceholder")}
                    required={mode === "register"}
                    autoComplete="name"
                    style={{
                      width: "100%",
                      padding: "11px 13px",
                      borderRadius: 10,
                      border: "1px solid #d6d3d1",
                      background: "#fff",
                      color: "#1c1917",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}
              <div>
                <label htmlFor={emailId} style={{ display: "block", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: "#57534e", marginBottom: 6 }}>
                  EMAIL
                </label>
                <input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  style={{
                    width: "100%",
                    padding: "11px 13px",
                    borderRadius: 10,
                    border: "1px solid #d6d3d1",
                    background: "#fff",
                    color: "#1c1917",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label htmlFor={pwId} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: "#57534e" }}>
                    PASSWORD
                  </label>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(28,25,23,0.4)" }}>{t("auth.pwHint")}</span>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id={pwId}
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    style={{
                      width: "100%",
                      padding: "11px 40px 11px 13px",
                      borderRadius: 10,
                      border: "1px solid #d6d3d1",
                      background: "#fff",
                      color: "#1c1917",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}
                    aria-pressed={showPw}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: "#57534e",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.59 9.59 0 0 0 5.39-1.61" />
                        <path d="M2 2l20 20" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {err && (
              <div role="alert" style={{ padding: "10px 12px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 13, marginBottom: 14, fontFamily: "DM Mono, monospace" }}>
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                background: "#0a0a14",
                color: "#fff",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                border: "1px solid #0a0a14",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>
                {loading ? t("auth.loading") : mode === "login" ? t("auth.loginCta") : activePlan || selectedPlan ? `${t("auth.registerCta")} — ${planName}` : t("auth.registerCta")}
              </span>
              {!loading && <span aria-hidden>→</span>}
            </button>

            <p style={{ textAlign: "center", margin: "16px 0 0", color: "#57534e", fontSize: 13 }}>
              {mode === "login" ? (
                <>
                  {t("auth.noAccount")}{" "}
                  <button type="button" onClick={() => switchMode("register")} style={{ background: "none", border: "none", color: "#0a0a14", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer", padding: 0 }}>
                    {t("auth.createAccount")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.hasAccount")}{" "}
                  <button type="button" onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#0a0a14", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer", padding: 0 }}>
                    {t("auth.signIn")}
                  </button>
                </>
              )}
            </p>

            <p style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(28,25,23,0.45)", textAlign: "center", margin: "14px 0 0", lineHeight: 1.6 }}>
              {t("auth.legalLine")}
            </p>
          </form>
        </div>
      </main>

      <style>{`@media(max-width: 880px){ .auth-layout{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
