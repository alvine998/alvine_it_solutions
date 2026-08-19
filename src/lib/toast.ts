let container: HTMLDivElement | null = null;

function getContainer() {
  if (container) return container;
  container = document.createElement("div");
  container.id = "app-toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "false");
  Object.assign(container.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "9999",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "center",
    pointerEvents: "none",
  } as CSSStyleDeclaration);
  document.body.appendChild(container);
  if (!document.getElementById("app-toast-style")) {
    const s = document.createElement("style");
    s.id = "app-toast-style";
    s.textContent = `@keyframes app-toast-in{from{opacity:0;transform:translateY(8px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes app-toast-out{from{opacity:1}to{opacity:0}}`;
    document.head.appendChild(s);
  }
  return container;
}

export function toast(message: string, duration = 2200) {
  if (typeof document === "undefined") return;
  const c = getContainer();
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.textContent = message;
  Object.assign(el.style, {
    pointerEvents: "auto",
    background: "#1c1917",
    color: "#fff",
    fontFamily: "DM Mono, monospace",
    fontSize: "12.5px",
    fontWeight: "600",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    maxWidth: "min(90vw, 360px)",
    textAlign: "center",
    animation: "app-toast-in 0.18s ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  } as CSSStyleDeclaration);
  c.appendChild(el);
  window.setTimeout(() => {
    el.style.animation = "app-toast-out 0.2s ease forwards";
    window.setTimeout(() => el.remove(), 220);
  }, duration);
}
