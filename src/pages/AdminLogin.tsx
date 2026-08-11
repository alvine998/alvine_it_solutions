import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        padding: 48,
        borderRadius: 24,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link to="/" style={{ display: "inline-block", marginBottom: 24 }}>
            <img src="/images/logo.png" alt="Logo" width={48} height={48} />
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 }}>
            Admin Login
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: "8px 0 0", fontSize: 15 }}>
            Sign in to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                required
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#ef4444",
              fontSize: 14,
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          <Link to="/" style={{ color: "#6366f1", textDecoration: "none" }}>
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}