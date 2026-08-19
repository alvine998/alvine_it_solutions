import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";

type RouterStatus = "active" | "inactive" | "blacklist";

interface RouterCustomer {
  _id: string;
  name: string;
  email: string;
  status: RouterStatus;
  createdAt: string;
  updatedAt: string;
}

interface RouterCustomerFormData {
  name: string;
  email: string;
  password: string;
  status: RouterStatus;
}

interface ListResponse {
  router_customers: RouterCustomer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const emptyForm: RouterCustomerFormData = {
  name: "",
  email: "",
  password: "",
  status: "active",
};

const statusStyles: Record<RouterStatus, { bg: string; color: string; border: string }> = {
  active: {
    bg: "rgba(16, 185, 129, 0.15)",
    color: "#10b981",
    border: "1px solid rgba(16, 185, 129, 0.3)",
  },
  inactive: {
    bg: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.5)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  blacklist: {
    bg: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },
};

export default function AdminRouterCustomers() {
  const [rows, setRows] = useState<RouterCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<"active" | "blacklist">("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RouterCustomer | null>(null);
  const [formData, setFormData] = useState<RouterCustomerFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<RouterCustomer | null>(null);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ status: tab, page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch.length >= 3) params.append("search", debouncedSearch);
      const res = await fetch(`/api/router-customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ListResponse = await res.json();
        setRows(data.router_customers);
        setTotalPages(Math.max(1, data.totalPages));
        setTotal(data.total);
      }
    } catch (e) {
      console.error("Error fetching router customers:", e);
    } finally {
      setLoading(false);
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
  }, [tab, page, debouncedSearch]);

  const handleOpenCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (row: RouterCustomer) => {
    setEditing(row);
    setFormData({ name: row.name, email: row.email, password: "", status: row.status });
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
      const url = editing ? `/api/router-customers/${editing._id}` : "/api/router-customers";
      const method = editing ? "PUT" : "POST";
      const body: any = { name: formData.name, email: formData.email, status: formData.status };
      if (!editing) body.password = formData.password;
      if (editing && formData.password) body.password = formData.password;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save router customer");
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
      const res = await fetch(`/api/router-customers/${deleteConfirm._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchRows();
      }
    } catch (e) {
      console.error("Error deleting router customer:", e);
    }
  };

  const handleToggleBlacklist = async (row: RouterCustomer) => {
    const nextStatus: RouterStatus = row.status === "blacklist" ? "active" : "blacklist";
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/router-customers/${row._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchRows();
    } catch (e) {
      console.error("Error updating router customer status:", e);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const switchTab = (next: "active" | "blacklist") => {
    setTab(next);
    setPage(1);
    setSearch("");
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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Router Customers</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Manage AI router customer accounts</p>
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
          Add Router Customer
        </button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Router customer status"
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 20,
        }}
      >
        {(["active", "blacklist"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              onClick={() => switchTab(t)}
              style={{
                padding: "10px 22px",
                borderRadius: 9,
                border: active ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                background: active ? "rgba(99, 102, 241, 0.15)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: t === "active" ? "#10b981" : "#ef4444",
                  boxShadow: t === "active" ? "0 0 6px #10b981" : "0 0 6px #ef4444",
                }}
              />
              {t === "active" ? "Active" : "Blacklist"}
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {tab === t ? total : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search router customers"
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
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M8 9h8M8 13h5" />
            </svg>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>
              {tab === "blacklist" ? "No blacklisted router customers found" : "No active router customers found"}
            </p>
          </div>
        ) : (
          rows.map((row) => {
            const st = statusStyles[row.status] ?? statusStyles.inactive;
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
                      background:
                        row.status === "blacklist"
                          ? "rgba(239, 68, 68, 0.15)"
                          : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{row.name}</div>
                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{row.email}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{formatDate(row.createdAt)}</span>
                  <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, ...st }}>
                    {row.status === "blacklist" ? "Blacklisted" : row.status}
                  </span>
                  {tab === "active" ? (
                    <button
                      onClick={() => handleToggleBlacklist(row)}
                      title="Blacklist this customer"
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Blacklist
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleBlacklist(row)}
                      title="Restore this customer"
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#10b981",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Restore
                    </button>
                  )}
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
            Page {page} of {totalPages} · {total} customer{total === 1 ? "" : "s"}
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
                {editing ? "Edit Router Customer" : "Add Router Customer"}
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
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="John Doe"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="john@company.com"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    {editing ? "New Password (leave blank to keep)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editing}
                    minLength={6}
                    placeholder={editing ? "••••••••" : "Min 6 characters"}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as RouterStatus })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blacklist">Blacklist</option>
                  </select>
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
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
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
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#fff" }}>Delete Router Customer</h3>
            <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: "#fff" }}>{deleteConfirm.name}</strong>? This action
              cannot be undone.
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
