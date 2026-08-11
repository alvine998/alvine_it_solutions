import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface TimelineEntry {
  _id: string;
  customerId: string;
  type: "note" | "call" | "email" | "meeting" | "task" | "status_change";
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface TimelineFormData {
  type: TimelineEntry["type"];
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

const emptyTimelineForm: TimelineFormData = {
  type: "note",
  title: "",
  description: "",
  startDate: "",
  endDate: "",
};

const typeConfig = {
  note: { label: "Note", color: "#6366f1", bg: "rgba(99, 102, 241, 0.15)" },
  call: { label: "Call", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  email: { label: "Email", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
  meeting: { label: "Meeting", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
  task: { label: "Task", color: "#ec4899", bg: "rgba(236, 72, 153, 0.15)" },
  status_change: { label: "Status", color: "#14b8a6", bg: "rgba(20, 184, 166, 0.15)" },
};

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [timelineForm, setTimelineForm] = useState<TimelineFormData>(emptyTimelineForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TimelineEntry["type"]>("all");
  const [editingTimeline, setEditingTimeline] = useState<TimelineEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    if (id) {
      fetchCustomer(id);
      fetchTimeline(id);
    }
  }, [id, navigate]);

  const fetchCustomer = async (customerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      } else {
        navigate("/admin/customers");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const fetchTimeline = async (customerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const params = typeFilter !== "all" ? `?type=${typeFilter}` : "";
      const res = await fetch(`/api/customers/${customerId}/timeline${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTimeline(data);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTimeline(id);
    }
  }, [typeFilter]);

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const url = editingTimeline
        ? `/api/customers/${id}/timeline/${editingTimeline._id}`
        : `/api/customers/${id}/timeline`;
      const method = editingTimeline ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(timelineForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save timeline entry");
      }

      setShowTimelineForm(false);
      setEditingTimeline(null);
      setTimelineForm(emptyTimelineForm);
      fetchTimeline(id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditTimeline = (entry: TimelineEntry) => {
    setEditingTimeline(entry);
    setTimelineForm({
      type: entry.type,
      title: entry.title,
      description: entry.description || "",
      startDate: entry.startDate || "",
      endDate: entry.endDate || "",
    });
    setShowTimelineForm(true);
  };

  const handleDeleteTimeline = async (timelineId: string) => {
    if (!id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/customers/${id}/timeline/${timelineId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDeleteConfirm(null);
        fetchTimeline(id);
      }
    } catch (error) {
      console.error("Error deleting timeline entry:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type: TimelineEntry["type"]) => {
    switch (type) {
      case "note":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
      case "call":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        );
      case "email":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        );
      case "meeting":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "task":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        );
      case "status_change":
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        );
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
    const totalDays = lastDay.getDate();
    const cells: ({ day: number; month: number; year: number; current: boolean })[] = [];
    // Leading days from previous month
    const prevLast = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevLast - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      cells.push({ day: d, month: m, year: y, current: false });
    }
    // Current month
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ day: d, month: currentMonth, year: currentYear, current: true });
    }
    // Trailing days
    let nextDay = 1;
    while (cells.length < 42) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      cells.push({ day: nextDay++, month: m, year: y, current: false });
    }
    return cells;
  };

  const toDateStr = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getEntriesForDay = (y: number, m: number, d: number) => {
    const dateStr = toDateStr(y, m, d);
    return timeline.filter((entry) => {
      if (!entry.startDate) return false;
      const start = entry.startDate.slice(0, 10);
      const end = entry.endDate ? entry.endDate.slice(0, 10) : start;
      return dateStr >= start && dateStr <= end;
    });
  };

  const isToday = (y: number, m: number, d: number) => {
    const t = new Date();
    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
  };

  const handleDayClick = (y: number, m: number, d: number) => {
    const dateStr = toDateStr(y, m, d);
    setEditingTimeline(null);
    setTimelineForm({ ...emptyTimelineForm, startDate: dateStr });
    setError("");
    setShowTimelineForm(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "rgba(255,255,255,0.6)" }}>
          Loading...
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.5)" }}>
          Customer not found
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <Link
          to="/admin/customers"
          style={{
            color: "rgba(255,255,255,0.5)",
            textDecoration: "none",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Customers
        </Link>
      </div>

      {/* Customer Info Card */}
      <div
        style={{
          padding: 28,
          borderRadius: 20,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: customer.status === "active" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff" }}>{customer.name}</h2>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: customer.status === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
                  color: customer.status === "active" ? "#10b981" : "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {customer.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Email</p>
                <p style={{ margin: 0, fontSize: 14, color: "#fff" }}>{customer.email}</p>
              </div>
              {customer.phone && (
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Phone</p>
                  <p style={{ margin: 0, fontSize: 14, color: "#fff" }}>{customer.phone}</p>
                </div>
              )}
              {customer.company && (
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Company</p>
                  <p style={{ margin: 0, fontSize: 14, color: "#fff" }}>{customer.company}</p>
                </div>
              )}
              {customer.address && (
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Address</p>
                  <p style={{ margin: 0, fontSize: 14, color: "#fff" }}>{customer.address}</p>
                </div>
              )}
            </div>
            {customer.notes && (
              <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Notes</p>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{customer.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>Timeline</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">All Types</option>
              <option value="note">Notes</option>
              <option value="call">Calls</option>
              <option value="email">Emails</option>
              <option value="meeting">Meetings</option>
              <option value="task">Tasks</option>
              <option value="status_change">Status Changes</option>
            </select>
            <button
              onClick={() => {
                setEditingTimeline(null);
                setTimelineForm(emptyTimelineForm);
                setError("");
                setShowTimelineForm(true);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Entry
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Calendar nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{monthNames[currentMonth]} {currentYear}</span>
            <button onClick={nextMonth} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {dayLabels.map((d) => (
              <div key={d} style={{ padding: "10px 4px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "1fr" }}>
            {getCalendarDays().map((cell, idx) => {
              const entries = getEntriesForDay(cell.year, cell.month, cell.day).filter(
                (e) => typeFilter === "all" || e.type === typeFilter,
              );
              const today = isToday(cell.year, cell.month, cell.day);
              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(cell.year, cell.month, cell.day)}
                  style={{
                    minHeight: 100,
                    padding: 6,
                    borderRight: idx % 7 !== 6 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: today ? "rgba(99, 102, 241, 0.08)" : cell.current ? "transparent" : "rgba(255,255,255,0.01)",
                    cursor: "pointer",
                    opacity: cell.current ? 1 : 0.3,
                    transition: "background 150ms",
                  }}
                  onMouseEnter={(e) => { if (cell.current) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = today ? "rgba(99, 102, 241, 0.08)" : cell.current ? "transparent" : "rgba(255,255,255,0.01)"; }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      fontSize: 12,
                      fontWeight: today ? 700 : 500,
                      color: today ? "#fff" : cell.current ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                      background: today ? "#6366f1" : "transparent",
                      marginBottom: 2,
                    }}
                  >
                    {cell.day}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {entries.slice(0, 3).map((entry) => {
                      const config = typeConfig[entry.type];
                      return (
                        <div
                          key={entry._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            padding: "2px 4px 2px 6px",
                            borderRadius: 4,
                            background: config.bg,
                            color: config.color,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "opacity 150ms",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0.85"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
                          title={entry.title}
                        >
                          <span
                            onClick={(e) => { e.stopPropagation(); handleEditTimeline(entry); }}
                            style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {entry.title}
                          </span>
                          <span
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(entry._id); }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 16,
                              height: 16,
                              borderRadius: 3,
                              flexShrink: 0,
                              opacity: 0.6,
                              transition: "opacity 150ms, background 150ms",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.opacity = "1"; (e.currentTarget as HTMLSpanElement).style.background = "rgba(239,68,68,0.2)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.opacity = "0.6"; (e.currentTarget as HTMLSpanElement).style.background = "transparent"; }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </span>
                        </div>
                      );
                    })}
                    {entries.length > 3 && (
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", paddingLeft: 6 }}>+{entries.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline Add/Edit Modal */}
      {showTimelineForm && (
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
          onClick={() => {
            setShowTimelineForm(false);
            setEditingTimeline(null);
          }}
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
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
                {editingTimeline ? "Edit Entry" : "Add Timeline Entry"}
              </h3>
              <button
                onClick={() => {
                  setShowTimelineForm(false);
                  setEditingTimeline(null);
                }}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 4 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddTimeline} style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Type *
                  </label>
                  <select
                    value={timelineForm.type}
                    onChange={(e) => setTimelineForm({ ...timelineForm, type: e.target.value as any })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      fontSize: 14,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="status_change">Status Change</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={timelineForm.title}
                    onChange={(e) => setTimelineForm({ ...timelineForm, title: e.target.value })}
                    required
                    placeholder="e.g., Called to discuss project requirements"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Description
                  </label>
                  <textarea
                    value={timelineForm.description}
                    onChange={(e) => setTimelineForm({ ...timelineForm, description: e.target.value })}
                    rows={4}
                    placeholder="Add more details..."
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={timelineForm.startDate}
                      onChange={(e) => setTimelineForm({ ...timelineForm, startDate: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.05)",
                        color: "#fff",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={timelineForm.endDate}
                      onChange={(e) => setTimelineForm({ ...timelineForm, endDate: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.05)",
                        color: "#fff",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
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

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowTimelineForm(false);
                    setEditingTimeline(null);
                  }}
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
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "12px",
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
                  {saving ? "Saving..." : editingTimeline ? "Update" : "Add"}
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
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#fff" }}>Delete Entry</h3>
            <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to delete this timeline entry? This action cannot be undone.
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
                onClick={() => handleDeleteTimeline(deleteConfirm)}
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
