import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import NumberInput from "../components/NumberInput";
import { parseNumberInput } from "../lib/numbers";

type PlanStatus = "active" | "inactive";

interface Plan {
  _id: string;
  name: string;
  price: number;
  credits: number;
  duration_days: number;
  cost_per_credit: number;
  features: string[];
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

interface PlanFormData {
  name: string;
  price: string;
  credits: string;
  duration_days: string;
  cost_per_credit: string;
  features: string;
  status: PlanStatus;
}

interface ListResponse {
  plans: Plan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const emptyForm: PlanFormData = {
  name: "",
  price: "",
  credits: "",
  duration_days: "30",
  cost_per_credit: "",
  features: "",
  status: "active",
};

export default function AdminPlans() {
  const [rows, setRows] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Plan | null>(null);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ status: tab, page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch.length >= 3) params.append("search", debouncedSearch);
      const res = await fetch(`/api/plans?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ListResponse = await res.json();
        setRows(data.plans);
        setTotalPages(Math.max(1, data.totalPages));
        setTotal(data.total);
      }
    } catch (e) {
      console.error("Error fetching plans:", e);
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

  const handleOpenEdit = (row: Plan) => {
    setEditing(row);
    setFormData({
      name: row.name,
      price: String(row.price),
      credits: String(row.credits),
      duration_days: String(row.duration_days),
      cost_per_credit: String(row.cost_per_credit ?? 0),
      features: row.features.join("\n"),
      status: row.status,
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
      const url = editing ? `/api/plans/${editing._id}` : "/api/plans";
      const method = editing ? "PUT" : "POST";
      const body = {
        name: formData.name,
        price: parseNumberInput(formData.price),
        credits: parseNumberInput(formData.credits),
        duration_days: parseNumberInput(formData.duration_days) || 30,
        cost_per_credit: parseNumberInput(formData.cost_per_credit),
        features: formData.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        status: formData.status,
      };
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save plan");
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
      const res = await fetch(`/api/plans/${deleteConfirm._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchRows();
      }
    } catch (e) {
      console.error("Error deleting plan:", e);
    }
  };

  const handleToggleStatus = async (row: Plan) => {
    const nextStatus: PlanStatus = row.status === "active" ? "inactive" : "active";
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/plans/${row._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchRows();
    } catch (e) {
      console.error("Error updating plan status:", e);
    }
  };

  const switchTab = (next: "active" | "inactive") => {
    setTab(next);
    setPage(1);
    setSearch("");
  };

  const formatIDR = (n: number) => n.toLocaleString("id-ID");

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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>AI Router Plans</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Manage AI router subscription plans</p>
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
          Add Plan
        </button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Plan status"
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
        {(["active", "inactive"] as const).map((t) => {
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
                  background: t === "active" ? "#10b981" : "#f59e0b",
                  boxShadow: t === "active" ? "0 0 6px #10b981" : "0 0 6px #f59e0b",
                }}
              />
              {t === "active" ? "Active" : "Inactive"}
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
            placeholder="Search by plan name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search plans"
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
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>
              {tab === "inactive" ? "No inactive plans found" : "No active plans found"}
            </p>
          </div>
        ) : (
          rows.map((row) => (
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
                  {row.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{row.name}</div>
                  <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    {row.features.length} feature{row.features.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>IDR {formatIDR(row.price)}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    {row.credits.toLocaleString("id-ID")} credits · {row.duration_days} days
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                    Cost {formatIDR(row.cost_per_credit ?? 0)}/credit
                  </div>
                </div>
                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: row.status === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                    color: row.status === "active" ? "#10b981" : "rgba(255,255,255,0.5)",
                    border: row.status === "active" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {row.status}
                </span>
                <button
                  onClick={() => handleToggleStatus(row)}
                  title={row.status === "active" ? "Deactivate this plan" : "Activate this plan"}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    background: row.status === "active" ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.15)",
                    color: row.status === "active" ? "#ef4444" : "#10b981",
                    border: row.status === "active" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {row.status === "active" ? "Deactivate" : "Activate"}
                </button>
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
          ))
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
            Page {page} of {totalPages} · {total} plan{total === 1 ? "" : "s"}
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
              maxWidth: 520,
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
                {editing ? "Edit Plan" : "Add Plan"}
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
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Starter"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                      Price (IDR) *
                    </label>
                    <NumberInput
                      value={formData.price}
                      onChange={(v) => setFormData({ ...formData, price: v })}
                      required
                      placeholder="150000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                      Credits *
                    </label>
                    <NumberInput
                      value={formData.credits}
                      onChange={(v) => setFormData({ ...formData, credits: v })}
                      required
                      placeholder="100000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                      Cost per Credit (IDR)
                    </label>
                    <NumberInput
                      value={formData.cost_per_credit}
                      onChange={(v) => setFormData({ ...formData, cost_per_credit: v })}
                      placeholder="300"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Duration (days) *
                  </label>
                  <NumberInput
                    value={formData.duration_days}
                    onChange={(v) => setFormData({ ...formData, duration_days: v })}
                    required
                    min={1}
                    placeholder="30"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Features (one per line)
                  </label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    rows={4}
                    placeholder={"20Mbps speed\n100k credits\n24/7 support"}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PlanStatus })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
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
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#fff" }}>Delete Plan</h3>
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
