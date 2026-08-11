import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";

interface LineItem {
  description: string;
  qty: number;
  rate: number;
}

interface Invoice {
  _id: string;
  number: string;
  issuedOn: string;
  dueOn: string;
  billTo: string;
  billToDetail: string;
  notes: string;
  taxPercent: number;
  discount: number;
  paymentStage: "full" | "dp" | "final";
  dpPercent: number;
  items: LineItem[];
  createdAt: string;
}

function computeTotal(invoice: Invoice): number {
  const subtotal = (invoice.items || []).reduce((sum, item) => sum + (item.qty || 0) * (item.rate || 0), 0);
  const taxAmount = subtotal * ((invoice.taxPercent || 0) / 100);
  return Math.max(subtotal + taxAmount - (invoice.discount || 0), 0);
}

export default function AdminInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | "full" | "dp" | "final">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchInvoices();
  }, [navigate]);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "\u2014";
    const parsed = new Date(dateString.includes("T") ? dateString : `${dateString}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

  const filtered = invoices.filter((inv) => {
    if (stageFilter !== "all" && inv.paymentStage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.number.toLowerCase().includes(q) || inv.billTo.toLowerCase().includes(q);
    }
    return true;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + computeTotal(inv), 0);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "rgba(255,255,255,0.6)" }}>
          Loading...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Invoices</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Manage your invoices
          </p>
        </div>
        <Link
          to="/generate/invoice"
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Invoice
        </Link>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Total</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff" }}>{invoices.length}</p>
        </div>
        <div style={{ padding: 20, borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Full Payment</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#10b981" }}>{invoices.filter((i) => i.paymentStage === "full").length}</p>
        </div>
        <div style={{ padding: 20, borderRadius: 12, background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Partial / DP</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{invoices.filter((i) => i.paymentStage !== "full").length}</p>
        </div>
        <div style={{ padding: 20, borderRadius: 12, background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Total Revenue</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#818cf8" }}>{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by invoice number or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: 14,
            outline: "none",
          }}
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as any)}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: 14,
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">All Stages</option>
          <option value="full">Full</option>
          <option value="dp">Down Payment</option>
          <option value="final">Final Payment</option>
        </select>
      </div>

      {/* Invoice List */}
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>No invoices found</p>
            <Link
              to="/generate/invoice"
              style={{
                display: "inline-block",
                marginTop: 16,
                padding: "10px 20px",
                borderRadius: 8,
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Create your first invoice
            </Link>
          </div>
        ) : (
          filtered.map((invoice) => {
            const total = computeTotal(invoice);
            return (
              <div
                key={invoice._id}
                style={{
                  padding: 24,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 200 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: invoice.paymentStage === "full" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={invoice.paymentStage === "full" ? "#10b981" : "#f59e0b"} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>{invoice.number}</h3>
                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{invoice.billTo}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{formatDate(invoice.issuedOn)}</span>
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      background: invoice.paymentStage === "full" ? "rgba(16, 185, 129, 0.15)" : invoice.paymentStage === "dp" ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)",
                      color: invoice.paymentStage === "full" ? "#10b981" : invoice.paymentStage === "dp" ? "#f59e0b" : "#818cf8",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {invoice.paymentStage.toUpperCase()}
                  </span>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff", minWidth: 140, textAlign: "right" }}>
                    {formatCurrency(total)}
                  </p>

                  <Link
                    to={`/generate/invoice?edit=${invoice._id}`}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(invoice._id)}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{ width: "100%", maxWidth: 400, background: "#0f0f19", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", padding: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#fff" }}>Delete Invoice</h3>
            <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  background: "rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
