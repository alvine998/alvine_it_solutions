import { useState, useRef, useEffect } from "react";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi — I'm your AI router. Ask anything. Model selection is automatic (auto)." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const shellBg = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const formBg = isLight ? "rgba(248,247,245,0.9)" : "rgba(10,10,20,0.6)";
  const inputBg = isLight ? "#fff" : "#0f0f1a";

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); } catch {} };

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setErr("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/router-customers/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ messages: nextMessages.map(m => ({ role: m.role, content: m.content })), model: "auto" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
      const reply =
        data.choices?.[0]?.message?.content ??
        data.content ??
        data.reply ??
        data.message ??
        (typeof data === "string" ? data : JSON.stringify(data, null, 2));
      setMessages(m => [...m, { role: "assistant", content: String(reply) }]);
    } catch (e: any) {
      const msg = e.message || "Failed to send";
      setErr(msg);
      if (/404|Failed to fetch|NetworkError/i.test(msg)) {
        setMessages(m => [...m, { role: "assistant", content: "Chat endpoint not configured yet. Wire POST /api/router-customers/chat/completions to your AI router to enable live replies. (This UI is ready — message was not sent to a model.)" }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 88px)", minHeight: 520, borderRadius: 16, border: `1px solid ${border}`, background: shellBg, overflow: "hidden", boxShadow: isLight ? "0 1px 14px rgba(0,0,0,0.06)" : "none" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: isLight ? "#fff" : "transparent" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px rgba(16,185,129,0.5)" }} />
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: muted }}>CHAT — MODEL: AUTO</span>
        <span style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 11, color: muted }}>baseURL: router.alvineitsolutions.com</span>
        <button onClick={() => token && copy(token)} style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>Copy token</button>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", gap: 12, alignContent: "start", background: isLight ? "linear-gradient(180deg, rgba(99,102,241,0.04), transparent 22%)" : "linear-gradient(180deg, rgba(99,102,241,0.04), transparent 22%)" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "78%",
              padding: "10px 13px",
              borderRadius: 14,
              border: `1px solid ${border}`,
              background: m.role === "user" ? "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(6,182,214,0.14))" : isLight ? "#f5f5f4" : "rgba(255,255,255,0.04)",
              color: m.role === "user" ? (isLight ? "#1e1b4b" : "#fff") : fg,
              fontSize: 13.5,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              boxShadow: m.role === "user" ? "0 4px 16px rgba(99,102,241,0.15)" : "none",
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: muted, padding: "4px 2px" }}>thinking…</div>}
      </div>

      {err && <div role="alert" style={{ margin: "0 16px", padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)", color: isLight ? "#9f1239" : "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 12 }}>{err}</div>}

      <form onSubmit={send} style={{ padding: 12, borderTop: `1px solid ${border}`, background: formBg, display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Message… (Shift+Enter for new line)"
          rows={1}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 140,
            padding: "11px 13px",
            borderRadius: 12,
            border: `1px solid ${border}`,
            background: inputBg,
            color: fg,
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            resize: "none",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "11px 18px",
            borderRadius: 12,
            border: "1px solid rgba(99,102,241,0.35)",
            background: loading || !input.trim() ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)") : "linear-gradient(135deg,#6366f1,#06b6d4)",
            color: loading || !input.trim() ? muted : "#fff",
            fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 13,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          Send →
        </button>
      </form>
    </div>
  );
}
