import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";

interface PlanOption {
  _id: string;
  name: string;
  price?: number;
}

interface CustomerOption {
  _id: string;
  name: string;
  email: string;
}

interface CustomerPlan {
  _id: string;
  customer_id: { _id: string; name: string; email: string } | string;
  plan_id: { _id: string; name: string; price?: number } | string;
  start_date: string;
  due_date: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerPlanFormData {
  customer_id: string;
  plan_id: string;
  start_date: string;
  due_date: string;
}

interface ListResponse {
  customer_plans: CustomerPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const emptyForm: CustomerPlanFormData = {
  customer_id: "",
  plan_id: "",
  start_date: "",
  due_date: "",
};

export default function AdminCustomerPlans() {
  const [rows, setRows] = useState<CustomerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomerPlan | null>(null);
  const [formData, setFormData] = useState<CustomerPlanFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<CustomerPlan | null>(null);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch.length >= 3) params.append("search", debouncedSearch);
      const res = await fetch(`/api/customer-plans?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ListResponse = await res.json();
        setRows(data.customer_plans);
        setTotalPages(Math.max(1, data.totalPages));
        setTotal(data.total);
      }
    } catch (e) {
      console.error("Error fetching customer plans:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/router-customers?status=active&limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.router_customers || []);
      }
    } catch (e) {
      console.error("Error fetching customers:", e);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/plans?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (e) {
      console.error("Error fetching plans:", e);
    }
  };

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length === 0) {
      setDebouncedSearch("");
      return;
    }
    if (trimmed.length < 3) return; // no fetch until 3 characters
    const timer = setTimeout(() => setDebouncedSearch(trimmed), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchRows();
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (row: CustomerPlan) => {
    setEditing(row);
    setFormData({
      customer_id: typeof row.customer_id === "string" ? row.customer_id : row.customer_id._id,
      plan_id: typeof row.plan_id === "string" ? row.plan_id : row.plan_id._id,
      start_date: row.start_date ? row.start_date.slice(0, 10) : "",
      due_date: row.due_date ? row.due_date.slice(0, 10) : "",
    });
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData(emptyForm);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = editing ? `/api/customer-plans/${editing._id}` : "/api/customer-plans";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save customer plan");
      handleCloseModal();
      fetchRows();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/customer-plans/${deleteConfirm._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchRows();
      }
    } catch (e) {
      console.error("Error deleting customer plan:", e);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const planStatus = (row: CustomerPlan): "active" | "expiring" | "expired" => {
    const due = new Date(row.due_date).getTime();
    const now = Date.now();
    const daysLeft = (due - now) / 86400000;
    if (daysLeft < 0) return "expired";
    if (daysLeft <= 14) return "expiring";
    return "active";
  };

  const statusStyles: Record<"active" | "expiring" | "expired", { bg: string; color: string; border: string }> = {
    active: {
      bg: "rgba(16, 185, 129, 0.15)",
      color: "#10b981",
      border: "1px solid rgba(16, 185, 129, 0.3)",
    },
    expiring: {
      bg: "rgba(245, 158, 11, 0.12)",
      color: "#f59e0b",
      border: "1px solid rgba(245, 158, 11, 0.3)",
    },
    expired: {
      bg: "rgba(239, 68, 68, 0.12)",
      color: "#ef4444",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Customer Plans</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Assign internet plans to customers with billing periods</p>
        </div>
        <button
          onClick={handleOpenCreate}
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Assign Plan
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by customer name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search customer plans"
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
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            color: search.trim().length > 0 && search.trim().length < 3 ? "#a5b4fc" : "rgba(255,255,255,0.35)",
          }}
        >
          {search.trim().length > 0 && search.trim().length < 3
            ? `Type at least 3 characters to search (${search.trim().length}/3)`
            : "Search activates after 3 characters"}
        </p>
      </div>

      {/* List */}
      <div style={{ display: "grid", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              borderRadius: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>No customer plans found</p>
          </div>
        ) : (
          rows.map((row) => {
            const customer = typeof row.customer_id === "string" ? null : row.customer_id;
            const plan = typeof row.plan_id === "string" ? null : row.plan_id;
            const st = statusStyles[planStatus(row)];
            return (
              <div
                key={row._id}
                style={{
                  padding: 20,
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
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    {(customer?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{customer?.name || "Unknown customer"}</div>
                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                      {plan?.name || "Unknown plan"}
                      {typeof plan?.price === "number" ? ` · IDR ${plan.price.toLocaleString("id-ID")}` : ""}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    {formatDate(row.start_date)} → {formatDate(row.due_date)}
                  </span>
                  <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, ...st }}>
                    {planStatus(row) === "expired" ? "Expired" : planStatus(row) === "expiring" ? "Expiring soon" : "Active"}
                  </span>
                  <button
                    onClick={() => handleOpenEdit(row)}
                    style={{
                      padding: "8px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(row)}
                    style={{
                      padding: "8px",
                      borderRadius: 8,
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      cursor: "pointer",
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

      {/* Pagination */}
      {!loading && rows.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Page {page} of {totalPages} · {total} assignment{total === 1 ? "" : "s"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                color: page <= 1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                color: page >= totalPages ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 24,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#0f0f19",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {editing ? "Edit Customer Plan" : "Assign Plan to Customer"}
              </h2>
              <button
                onClick={handleCloseModal}
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Customer *
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    required
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Plan *
                  </label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    required
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">Select plan...</option>
                    {plans.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                        {typeof p.price === "number" ? ` — IDR ${p.price.toLocaleString("id-ID")}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    placeholder="YYYY-MM-DD"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    placeholder="YYYY-MM-DD"
                    style={inputStyle}
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "#ef4444",
                    fontSize: 14,
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    flex: 1,
                    padding: "14px",
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
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff",
                    border: "none",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : editing ? "Update" : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 24,
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              background: "#0f0f19",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#fff" }}>Delete Customer Plan</h3>
            <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete this plan assignment? This action cannot be undone.
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
                onClick={handleDelete}
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
