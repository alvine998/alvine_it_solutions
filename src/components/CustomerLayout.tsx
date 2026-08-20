import { createContext, useContext, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCustomerTheme } from "../hooks/useCustomerTheme";
import { usePageMeta } from "../hooks/usePageMeta";

type MeUser = { id: string; name: string; email: string; status: string; ref_code?: string };

type CustomerContextValue = {
  user: MeUser | null;
  token: string | null;
  refreshMe: () => Promise<void>;
};

const CustomerContext = createContext<CustomerContextValue>({ user: null, token: null, refreshMe: async () => {} });
export const useCustomer = () => useContext(CustomerContext);

const NAV = [
  {
    path: "/dashboard",
    label: "Dashboard",
    desc: "Overview",
    exact: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: "/dashboard/chat",
    label: "Chat",
    desc: "Chat with AI",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.4 8.4 0 0 1-1.2 4.3 7.7 7.7 0 0 1-3 3A8.2 8.2 0 0 1 12 20a8.2 8.2 0 0 1-4.8-1.5 7.7 7.7 0 0 1-3-3A8.4 8.4 0 0 1 3 11.5C3 6.8 7.03 3 12 3s9 3.8 9 8.5Z" />
        <path d="M8 12h8M8 8h5" />
      </svg>
    ),
  },
  {
    path: "/dashboard/usage",
    label: "Usage",
    desc: "Credits & logs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M3 3v18h18" />
        <rect x="7" y="12" width="3" height="6" rx="1" />
        <rect x="12" y="8" width="3" height="10" rx="1" />
        <rect x="17" y="5" width="3" height="13" rx="1" />
      </svg>
    ),
  },
  {
    path: "/dashboard/orders",
    label: "Orders",
    desc: "Orders & pay",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M6 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    path: "/dashboard/docs",
    label: "API Reference",
    desc: "Endpoints",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    path: "/dashboard/documentation",
    label: "Documentation",
    desc: "Concepts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    ),
  },
  {
    path: "/dashboard/integration",
    label: "Integration",
    desc: "Code samples",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    path: "/dashboard/api-keys",
    label: "API Keys",
    desc: "Customer keys",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M21 11a4 4 0 0 1-4 4H7l-4 4V5a2 2 0 0 1 2-2h10a4 4 0 0 1 4 4v4Z" />
        <path d="M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
      </svg>
    ),
  },
  {
    path: "/dashboard/profile",
    label: "Profile",
    desc: "Account",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function CustomerLayout() {
  usePageMeta("dashboard", { noindex: true });
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, toggle } = useCustomerTheme();
  const isLight = theme === "light";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchMe = async () => {
    if (!token) {
      navigate("/auth?mode=login", { replace: true });
      return;
    }
    try {
      const res = await fetch("/api/router-customers/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(res.status === 401 ? "expired" : "Failed");
      const data = await res.json();
      const u: MeUser = data.user ?? data.router_customer;
      setUser(u);
    } catch (e: any) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("router_customer");
      navigate("/auth?mode=login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("router_customer");
    localStorage.removeItem("selectedPlan");
    navigate("/auth?mode=login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a14", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.6)", fontFamily: "Inter, sans-serif" }}>
        Loading dashboard…
      </div>
    );
  }

  const pageTitle =
    (NAV.find((n) => (n as any).exact ? location.pathname === n.path : location.pathname === n.path || location.pathname.startsWith(n.path + "/"))?.label) ??
    (location.pathname === "/dashboard" ? "Dashboard" : undefined) ??
    location.pathname.split("/").pop()?.replace("-", " ") ??
    "Dashboard";

  const shellBg = isLight ? "#f8f7f5" : "#0a0a14";
  const shellFg = isLight ? "#1c1917" : "#fff";
  const sidebarBg = isLight ? "#ffffff" : "rgba(15,15,25,0.98)";
  const headerBg = isLight ? "rgba(248,247,245,0.92)" : "rgba(10,10,20,0.92)";
  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const onChipBg = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)";
  const onChipFg = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.38)";

  return (
    <CustomerContext.Provider value={{ user, token, refreshMe: fetchMe }}>
      <div className="cust-shell" data-cust-theme={theme} style={{ display: "flex", minHeight: "100vh", background: shellBg, fontFamily: "Inter, sans-serif", color: shellFg, ["--cust-bg" as any]: shellBg, ["--cust-fg" as any]: shellFg, ["--cust-border" as any]: border, ["--cust-chip-bg" as any]: onChipBg, ["--cust-chip-fg" as any]: onChipFg, ["--cust-sidebar-bg" as any]: sidebarBg, ["--cust-header-bg" as any]: headerBg } as any}>
        {/* overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40, display: "none" }}
            className="cust-overlay"
          />
        )}

        {/* sidebar */}
        <aside
          style={{
            width: 272,
            background: isLight ? "#ffffff" : "rgba(15,15,25,0.98)",
            borderRight: `1px solid ${border}`,
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            zIndex: 50,
          }}
          className="cust-sidebar"
        >
          <div style={{ padding: "22px 20px", borderBottom: `1px solid ${border}` }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "grid", placeItems: "center", fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: "#fff" }}>A</span>
              <span>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: -0.2, color: isLight ? "#1c1917" : "#fff", lineHeight: 1 }}>ALVINE IT</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: 1.2, color: isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)", marginTop: 2 }}>CUSTOMER</div>
              </span>
            </Link>
          </div>

          <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: 1, color: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.28)", padding: "8px 10px 6px" }}>MENU</div>
            {NAV.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={(item as any).exact}
                onClick={() => setSidebarOpen(false)}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 12px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: isActive ? (isLight ? "#1c1917" : "#fff") : isLight ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.62)",
                  background: isActive ? (isLight ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.14)") : "transparent",
                  border: isActive ? "1px solid rgba(99,102,241,0.28)" : "1px solid transparent",
                  transition: "all 0.18s ease",
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 500,
                })}
              >
                <span style={{ opacity: 0.9, display: "grid", placeItems: "center", color: "inherit" }}>{item.icon}</span>
                <span style={{ display: "grid", lineHeight: 1.15 }}>
                  <span>{item.label}</span>
                  <span style={{ fontSize: 11, color: isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.38)", fontWeight: 400 }}>{item.desc}</span>
                </span>
              </NavLink>
            ))}
          </nav>

          <div style={{ padding: "14px 16px", borderTop: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                {(user?.name?.[0] ?? "C").toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isLight ? "#1c1917" : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name ?? "—"}</div>
                <div style={{ fontSize: 11.5, color: isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email ?? "—"}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 10, padding: "4px 7px", borderRadius: 20, background: user?.status === "active" ? "rgba(16,185,129,0.14)" : "rgba(245,158,11,0.14)", border: `1px solid ${user?.status === "active" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`, color: user?.status === "active" ? "#10b981" : "#f59e0b", fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: 0.4 }}>{user?.status ?? "—"}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                color: "#fecaca",
                border: "1px solid rgba(239,68,68,0.18)",
                cursor: "pointer",
                fontSize: 12.5,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* main */}
        <div style={{ flex: 1, marginLeft: 272, display: "flex", flexDirection: "column", minHeight: "100vh" }} className="cust-main">
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 30,
              padding: "14px 24px",
              background: headerBg,
              backdropFilter: "blur(16px)",
              borderBottom: `1px solid ${border}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="cust-menu-btn"
              aria-label="Toggle menu"
              style={{ display: "none", background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: 8, color: isLight ? "#1c1917" : "#fff", cursor: "pointer" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: isLight ? "#1c1917" : "#fff", textTransform: "capitalize" }}>{pageTitle}</h1>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {/* customer dashboard scoped: theme + language (EN/ID/中文) */}
              <button
                type="button"
                onClick={toggle}
                aria-label={isLight ? t("dashboard.switchToDark", { defaultValue: "Switch to dark" }) : t("dashboard.switchToLight", { defaultValue: "Switch to light" })}
                title={isLight ? "Dark" : "Light"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 10px", borderRadius: 20,
                  border: `1px solid ${border}`, background: onChipBg, color: isLight ? "#1c1917" : "#fff",
                  cursor: "pointer", fontFamily: "DM Mono, monospace", fontSize: 11,
                }}
              >
                <span aria-hidden style={{ lineHeight: 1 }}>{isLight ? "☾" : "☀"}</span>
                {isLight ? "Dark" : "Light"}
              </button>
              <span aria-hidden style={{ color: border }}>·</span>
              {(["en", "id", "zh"] as const).map(code => (
                <button
                  key={code}
                  type="button"
                  onClick={() => i18n.changeLanguage(code)}
                  aria-pressed={i18n.language === code}
                  style={{
                    padding: "6px 10px", borderRadius: 20, fontFamily: "DM Mono, monospace", fontSize: 11, cursor: "pointer",
                    border: i18n.language === code ? "1px solid rgba(99,102,241,0.35)" : `1px solid ${border}`,
                    background: i18n.language === code ? "rgba(99,102,241,0.15)" : onChipBg,
                    color: i18n.language === code ? "#6366f1" : isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)",
                    fontWeight: i18n.language === code ? 700 : 400,
                  }}
                >
                  {code === "zh" ? "中文" : code.toUpperCase()}
                </button>
              ))}
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: onChipFg, border: `1px solid ${border}`, padding: "6px 10px", borderRadius: 20, background: onChipBg }}>model: auto</span>
              <Link to="/" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: isLight ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.65)", textDecoration: "none", border: `1px solid ${border}`, padding: "6px 11px", borderRadius: 20, background: onChipBg }}>{t("dashboard.viewSite", { defaultValue: "View site" })}</Link>
            </div>
          </header>

          <div style={{ flex: 1, padding: "24px", maxWidth: 1120, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
            <Outlet />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px){
          .cust-sidebar{ transform: translateX(${sidebarOpen ? "0" : "-100%"}); transition: transform 0.28s ease; }
          .cust-main{ margin-left: 0 !important; }
          .cust-menu-btn{ display: grid !important; place-items: center; }
          .cust-overlay{ display: block !important; }
        }
      `}</style>
    </CustomerContext.Provider>
  );
}
