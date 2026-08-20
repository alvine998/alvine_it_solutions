import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";

export default function AdminSettings() {
  const [telegram, setTelegram] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [hasBot, setHasBot] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [msgKind, setMsgKind] = useState<"ok" | "err">("ok");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setTelegram(d.telegram_username || "");
        if (typeof d.telegram_chat_id === "string") setChatId(d.telegram_chat_id);
        if (typeof d.telegram_bot_token === "string" && d.telegram_bot_token) setBotToken(d.telegram_bot_token);
        setHasBot(Boolean(d.has_telegram_bot));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const body: any = { telegram_username: telegram };
      // Only send token if user actually typed something (placeholder = don't overwrite)
      if (botToken && !botToken.includes("•")) body.telegram_bot_token = botToken;
      if (chatId !== "") body.telegram_chat_id = chatId;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setTelegram(data.telegram_username || "");
      if (typeof data.telegram_chat_id === "string") setChatId(data.telegram_chat_id);
      setHasBot(Boolean(data.has_telegram_bot));
      setMsgKind("ok");
      setMessage("Saved. Customers see Telegram link; Telegram bot will notify this chat on payment submissions.");
    } catch (e: any) {
      setMsgKind("err");
      setMessage(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/settings/telegram/test", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setMsgKind("ok");
      setMessage(j.message || "Test sent. Check Telegram.");
    } catch (e: any) {
      setMsgKind("err");
      setMessage(e.message || "Failed to send test");
    } finally {
      setTesting(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 560 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Settings</h2>
        <p style={{ margin: "4px 0 24px", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
          Store settings shown during checkout + Telegram payment notifications
        </p>

        <div style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
            Admin Telegram username (customer contact link)
          </label>
          <input type="text" value={telegram} disabled={!loaded} onChange={(e) => setTelegram(e.target.value)} placeholder="alvineitsupport" style={inputStyle} />
          <p style={{ margin: "8px 0 20px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            Customers who submitted payment proof can chat with you at t.me/{telegram || "username"}.
          </p>

          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 0 20px" }} />

          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#fff" }}>Telegram bot — new payment alerts</p>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
            When a customer submits payment proof, bot sends proof photo + order details to Chat ID.<br />
            Create bot via @BotFather → /newbot → copy token. Get Chat ID by messaging bot, then call <code style={{ color: "rgba(255,255,255,0.7)" }}>getUpdates</code>. Env vars <code style={{ color: "rgba(255,255,255,0.7)" }}>TELEGRAM_BOT_TOKEN</code>/<code style={{ color: "rgba(255,255,255,0.7)" }}>TELEGRAM_CHAT_ID</code> override these if set.
            {hasBot ? <span style={{ color: "#10b981" }}> · Bot linked ✓</span> : <span style={{ color: "#f59e0b" }}> · Not configured</span>}
          </p>

          <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Bot token</label>
          <input type="password" value={botToken} disabled={!loaded} onChange={(e) => setBotToken(e.target.value)} placeholder="123456:ABC-..." style={{ ...inputStyle, marginBottom: 14 }} />

          <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Chat ID</label>
          <input type="text" value={chatId} disabled={!loaded} onChange={(e) => setChatId(e.target.value)} placeholder="-100123... or 123456789" style={inputStyle} />
          {(() => { const bid = botToken.split(":")[0]?.trim(); return bid && chatId.trim() === bid ? (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#f87171", lineHeight: 1.4 }}>
              Chat ID equals bot ID ({bid}) — bot can't message itself. Fix: message the bot as <b>you</b>, then open <code style={{ color:"#fca5a5" }}>https://api.telegram.org/bot{bid}:.../getUpdates</code> and copy your <code>message.chat.id</code> (or group <code>-100...</code>). Paste that here.
            </p>
          ) : null; })()}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={handleSave} disabled={saving || !loaded} style={{ padding: "12px 24px", borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Save Settings"}
            </button>
            <button onClick={handleTest} disabled={testing || !loaded || !hasBot} title={!hasBot ? "Save bot token + chat ID first" : ""} style={{ padding: "12px 20px", borderRadius: 10, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.14)", cursor: testing || !hasBot ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: testing || !hasBot ? 0.5 : 1 }}>
              {testing ? "Sending…" : "Send test"}
            </button>
          </div>

          {message && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: msgKind === "ok" ? "rgba(16, 185, 129, 0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${msgKind === "ok" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, color: msgKind === "ok" ? "#10b981" : "#f87171", fontSize: 13 }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
