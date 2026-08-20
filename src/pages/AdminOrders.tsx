import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";

type OrderStatus = "pending" | "awaiting_verification" | "paid" | "cancelled" | "expired";

interface OrderRow {
  _id: string;
  customer_id: { name?: string; email?: string } | null;
  plan_id: { name?: string } | null;
  amount: number;
  credits: number;
  status: OrderStatus;
  payment_method?: string;
  payment_ref?: string;
  evidence_url?: string;
  createdAt: string;
}

interface ListResponse {
  orders: OrderRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const statusStyles: Record<OrderStatus, { bg: string; color: string; border: string }> = {
  pending: { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" },
  awaiting_verification: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" },
  paid: { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" },
  cancelled: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.25)" },
  expired: { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" },
};

const money = (n: number) => `IDR ${Number(n).toLocaleString("id-ID")}`;

export default function AdminOrders() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<OrderRow | null>(null);

  const fetchRows = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ListResponse = await res.json();
        setRows(data.orders);
        setTotalPages(Math.max(1, data.totalPages));
        setTotal(data.total);
      } else {
        setError("Failed to load orders");
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, [statusFilter, page]);

  const handleVerify = async (row: OrderRow) => {
    if (!confirm(`Verify payment for ${row.customer_id?.name || row.customer_id?.email || "this customer"}? This provisions credits.`)) return;
    try {
      setBusyId(row._id);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/orders/${row._id}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (res.ok) fetchRows();
      else setError("Failed to verify payment");
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (row: OrderRow) => {
    const note = prompt("Reason for rejection (optional):");
    if (note === null) return;
    try {
      setBusyId(row._id);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/orders/${row._id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note }),
      });
      if (res.ok) fetchRows();
      else setError("Failed to reject payment");
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Orders & Payments</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Review submitted payment proof and verify to activate plans
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
          aria-label="Filter by status"
          style={{
            padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", cursor: "pointer",
          }}
        >
          <option value="all">All Statuses</option>
          <option value="awaiting_verification">Awaiting Verification</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>No orders found</p>
          </div>
        ) : (
          rows.map((row) => {
            const ts = statusStyles[row.status];
            const needsAction = row.status === "awaiting_verification";
            return (
              <div
                key={row._id}
                style={{
                  padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)", display: "flex",
                  justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 240 }}>
                  {row.evidence_url ? (
                    <button onClick={() => setEvidence(row)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer" }}>
                      <img src={row.evidence_url} alt="evidence" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)", background: "#fff" }} />
                    </button>
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  )}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
                      {row.customer_id?.name || row.customer_id?.email || "Customer"}
                    </div>
                    <div style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                      {row.plan_id?.name || "Plan"} · {money(row.amount)}
                      {row.payment_method ? ` · ${row.payment_method}` : ""}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    {new Date(row.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, ...ts }}>
                    {row.status.replace("_", " ")}
                  </span>
                  {needsAction && (
                    <>
                      <button
                        onClick={() => handleVerify(row)}
                        disabled={busyId === row._id}
                        style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", cursor: busyId === row._id ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                      >
                        {busyId === row._id ? "…" : "Verify"}
                      </button>
                      <button
                        onClick={() => handleReject(row)}
                        disabled={busyId === row._id}
                        style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", cursor: busyId === row._id ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && rows.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Page {page} of {totalPages} · {total} order{total === 1 ? "" : "s"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: page <= 1 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)", cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
              ← Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: page >= totalPages ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)", cursor: page >= totalPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {evidence && (
        <div onClick={() => setEvidence(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }} >
          <img src={evidence.evidence_url} alt="payment evidence" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)" }} />
        </div>
      )}
    </AdminLayout>
  );
}
