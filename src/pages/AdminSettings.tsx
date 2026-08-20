import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";

export default function AdminSettings() {
  const [telegram, setTelegram] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setTelegram(d.telegram_username || ""))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ telegram_username: telegram }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setTelegram(data.telegram_username || "");
      setMessage("Saved. Customers will see this Telegram contact while their payment is being verified.");
    } catch (e: any) {
      setMessage(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 560 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Settings</h2>
        <p style={{ margin: "4px 0 24px", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
          General store settings shown to customers during checkout
        </p>

        <div style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
            Admin Telegram username
          </label>
          <input
            type="text"
            value={telegram}
            disabled={!loaded}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="alvineitsupport"
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)",
              color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            Customers who submitted payment proof can chat with you here while awaiting verification.
          </p>

          <button
            onClick={handleSave}
            disabled={saving || !loaded}
            style={{
              marginTop: 16, padding: "12px 24px", borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none",
              cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>

          {message && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "#10b981", fontSize: 13 }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
