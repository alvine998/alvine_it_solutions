import { useEffect, useState } from "react";

export type CustTheme = "dark" | "light";

const KEY = "cust_theme";

export function useCustomerTheme() {
  const [theme, setTheme] = useState<CustTheme>(() => {
    const v = typeof window !== "undefined" ? (localStorage.getItem(KEY) as CustTheme | null) : null;
    if (v === "light" || v === "dark") return v;
    // respect system for first paint
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem(KEY, theme);
    document.documentElement.setAttribute("data-cust-theme", theme);
    let s = document.getElementById("cust-light-style") as HTMLStyleElement | null;
    if (!s) {
      s = document.createElement("style");
      s.id = "cust-light-style";
      document.head.appendChild(s);
    }
    s.textContent = `.cust-shell[data-cust-theme="light"]{color-scheme:light}
.cust-shell[data-cust-theme="light"] .cust-sidebar{box-shadow:0 1px 24px rgba(0,0,0,0.07)}
.cust-shell[data-cust-theme="light"] ::selection{background:#6366f1;color:#fff}
.cust-shell[data-cust-theme="light"] ::-webkit-scrollbar{width:8px;height:8px}
.cust-shell[data-cust-theme="light"] ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.14);border-radius:20px}
.cust-shell[data-cust-theme="light"] ::-webkit-scrollbar-track{background:transparent}`;
  }, [theme]);

  // sync across tabs
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === KEY && (e.newValue === "dark" || e.newValue === "light")) setTheme(e.newValue);
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  return { theme, setTheme, toggle: () => setTheme(t => (t === "dark" ? "light" : "dark")) };
}
