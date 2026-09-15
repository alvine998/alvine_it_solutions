import type { CSSProperties } from "react";

// Single source of truth for the light, clean B2B theme.
// Every landing section reads from here — no more scattered dark hex values.
export const theme = {
  page: "#ffffff",
  alt: "#f6f7fb",
  card: "#ffffff",
  ink: "#0b1220",
  body: "#475569",
  muted: "#6b7280",
  faint: "#94a3b8",
  line: "#e6e8f0",
  brand: "#4f46e5",
  brandDark: "#4338ca",
  brandTint: "#eef0ff",
  brandLine: "#c9cdfc",
  green: "#047857",
  greenBg: "#ecfdf5",
  greenLine: "#a7f3d0",
  waGreen: "#16a34a",
  shadow: "0 1px 2px rgba(16,24,40,0.05), 0 10px 28px rgba(16,24,40,0.07)",
  shadowSm: "0 1px 2px rgba(16,24,40,0.06)",
  radius: 20,
} as const;

export const card: CSSProperties = {
  background: theme.card,
  border: `1px solid ${theme.line}`,
  borderRadius: theme.radius,
  boxShadow: theme.shadowSm,
};

export const eyebrow = (color: string = theme.brand): CSSProperties => ({
  fontFamily: "Inter, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  color,
  textTransform: "uppercase",
  letterSpacing: 2.5,
  marginBottom: 14,
  display: "block",
});

export const h2: CSSProperties = {
  fontFamily: "Space Grotesk, sans-serif",
  fontSize: "clamp(30px, 4.5vw, 46px)",
  fontWeight: 800,
  color: theme.ink,
  lineHeight: 1.15,
  letterSpacing: "-1px",
  margin: "0 0 14px",
};

export const sub: CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  color: theme.body,
  maxWidth: 640,
  margin: "0 auto",
  lineHeight: 1.7,
};

export const pill: CSSProperties = {
  padding: "6px 13px",
  borderRadius: 50,
  background: "#f1f2f7",
  border: "1px solid #e2e4ee",
  color: "#3f4756",
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "Inter, sans-serif",
};

export const badgeTint: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 18px",
  borderRadius: 50,
  background: theme.brandTint,
  border: `1px solid ${theme.brandLine}`,
  color: theme.brandDark,
  fontSize: 13.5,
  fontWeight: 600,
  fontFamily: "Inter, sans-serif",
};
