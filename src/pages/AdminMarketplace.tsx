import { useState, useEffect, useRef } from "react";
import AdminLayout from "../components/AdminLayout";
import NumberInput from "../components/NumberInput";
import { parseNumberInput } from "../lib/numbers";

type MarketplaceStatus = "active" | "inactive";
type MarketplaceCategory = "web" | "mobile" | "desktop" | "api" | "template" | "other";

interface MarketplaceItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  tech: string[];
  category: MarketplaceCategory;
  images: string[];
  image: string;
  demoUrl: string;
  downloadUrl: string;
  featured: boolean;
  status: MarketplaceStatus;
  sales: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  tech: string;
  category: MarketplaceCategory;
  images: string[];
  demoUrl: string;
  downloadUrl: string;
  featured: boolean;
  status: MarketplaceStatus;
}

interface ListResponse {
  items: MarketplaceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const emptyForm: FormData = {
  name: "",
  description: "",
  price: "",
  tech: "",
  category: "web",
  images: [],
  demoUrl: "",
  downloadUrl: "",
  featured: false,
  status: "active",
};

const categoryOptions: MarketplaceCategory[] = ["web", "mobile", "desktop", "api", "template", "other"];

const categoryGradients: Record<string, string> = {
  web: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  mobile: "linear-gradient(135deg, #ec4899, #be185d)",
  desktop: "linear-gradient(135deg, #f59e0b, #d97706)",
  api: "linear-gradient(135deg, #06b6d4, #0891b2)",
  template: "linear-gradient(135deg, #10b981, #059669)",
  other: "linear-gradient(135deg, #6366f1, #06b6d4)",
};

function normalizeItemImages(row: MarketplaceItem): string[] {
  if (Array.isArray(row.images) && row.images.length > 0) return row.images;
  if (row.image) return [row.image];
  return [];
}

export default function AdminMarketplace() {
  const [rows, setRows] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MarketplaceItem | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<MarketplaceItem | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ status: tab, page: String(page), limit: String(PAGE_SIZE) });
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (debouncedSearch.length >= 2) params.append("search", debouncedSearch);
      const res = await fetch(`/api/marketplace?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: ListResponse = await res.json();
        setRows(data.items);
        setTotalPages(Math.max(1, data.totalPages));
        setTotal(data.total);
      }
    } catch (e) {
      console.error("Error fetching marketplace:", e);
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
    if (trimmed.length < 2) return;
    const timer = setTimeout(() => setDebouncedSearch(trimmed), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchRows();
  }, [tab, page, debouncedSearch, categoryFilter]);

  const handleOpenCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (row: MarketplaceItem) => {
    setEditing(row);
    setFormData({
      name: row.name,
      description: row.description,
      price: String(row.price),
      tech: row.tech.join(", "),
      category: row.category,
      images: normalizeItemImages(row),
      demoUrl: row.demoUrl,
      downloadUrl: row.downloadUrl,
      featured: row.featured,
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

  async function uploadImagesToR2(files: FileList | File[]): Promise<string[]> {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) throw new Error("No image files selected");
    const remaining = 10 - formData.images.length;
    if (remaining <= 0) throw new Error("Maximum 10 images reached — remove one first");
    const batch = arr.slice(0, remaining);
    const fd = new FormData();
    batch.forEach((f) => fd.append("images", f));
    const token = localStorage.getItem("token");
    const res = await fetch("/api/marketplace/upload-images", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upload failed");
    const urls: string[] = data.urls || [];
    if (urls.length === 0) throw new Error("No URLs returned");
    return urls;
  }

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploadingImages(true);
    try {
      const urls = await uploadImagesToR2(files);
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls].slice(0, 10) }));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImageAt = (idx: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const moveImage = (from: number, to: number) => {
    setFormData((prev) => {
      const next = [...prev.images];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...prev, images: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = editing ? `/api/marketplace/${editing._id}` : "/api/marketplace";
      const method = editing ? "PUT" : "POST";
      const body = {
        name: formData.name,
        description: formData.description,
        price: parseNumberInput(formData.price),
        tech: formData.tech
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        category: formData.category,
        images: formData.images,
        image: formData.images[0] || "",
        demoUrl: formData.demoUrl,
        downloadUrl: formData.downloadUrl,
        featured: formData.featured,
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
      if (!res.ok) throw new Error(data.error || "Failed to save item");
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
      const res = await fetch(`/api/marketplace/${deleteConfirm._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchRows();
      }
    } catch (e) {
      console.error("Error deleting item:", e);
    }
  };

  const handleToggleStatus = async (row: MarketplaceItem) => {
    const nextStatus: MarketplaceStatus = row.status === "active" ? "inactive" : "active";
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/marketplace/${row._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchRows();
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  const handleToggleFeatured = async (row: MarketplaceItem) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/marketplace/${row._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ featured: !row.featured }),
      });
      fetchRows();
    } catch (e) {
      console.error("Error updating featured:", e);
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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>Marketplace</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Manage code listings — web apps, mobile, APIs & templates · Images on R2</p>
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
          Add Item
        </button>
      </div>

      {/* Tabs + Category filter */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <div
          role="tablist"
          aria-label="Marketplace status"
          style={{
            display: "inline-flex",
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
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

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="all" style={{ background: "#1a1a2e" }}>All categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c} style={{ background: "#1a1a2e" }}>{c}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search marketplace"
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
            color: search.trim().length > 0 && search.trim().length < 2 ? "#a5b4fc" : "rgba(255,255,255,0.35)",
          }}
        >
          {search.trim().length > 0 && search.trim().length < 2
            ? `Type at least 2 characters to search (${search.trim().length}/2)`
            : "Search activates after 2 characters"}
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
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>
              {tab === "inactive" ? "No inactive items found" : "No marketplace items yet — add your first one!"}
            </p>
          </div>
        ) : (
          rows.map((row) => {
            const cover = (row.images && row.images[0]) || row.image || "";
            const count = row.images?.length ?? (row.image ? 1 : 0);
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
              <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 200 }}>
                {cover ? (
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img
                      src={cover}
                      alt=""
                      style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", display: "block" }}
                    />
                    {count > 1 && (
                      <span style={{
                        position: "absolute", right: -6, bottom: -6,
                        padding: "2px 6px", borderRadius: 20,
                        background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.2)",
                        color: "#fff", fontSize: 10, fontWeight: 700,
                      }}>+{count - 1}</span>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: categoryGradients[row.category] || categoryGradients.other,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {row.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{row.name}</span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: categoryGradients[row.category] || categoryGradients.other,
                        color: "#fff",
                        textTransform: "capitalize",
                      }}
                    >
                      {row.category}
                    </span>
                    {row.featured && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "rgba(245,158,11,0.2)",
                          color: "#f59e0b",
                          border: "1px solid rgba(245,158,11,0.3)",
                        }}
                      >
                        Featured
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>
                    {row.description}
                  </p>
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {row.tech.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        style={{
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.6)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                    {count > 0 && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{count}/10 images</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                    {row.price === 0 ? "Free" : `IDR ${formatIDR(row.price)}`}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{row.sales} sales</div>
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
                  onClick={() => handleToggleFeatured(row)}
                  title={row.featured ? "Remove featured" : "Mark as featured"}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    background: row.featured ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
                    color: row.featured ? "#f59e0b" : "rgba(255,255,255,0.5)",
                    border: row.featured ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {row.featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  onClick={() => handleToggleStatus(row)}
                  title={row.status === "active" ? "Deactivate" : "Activate"}
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
            Page {page} of {totalPages} · {total} item{total === 1 ? "" : "s"}
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
              maxWidth: 560,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#0f0f19",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)",
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
                position: "sticky",
                top: 0,
                background: "#0f0f19",
                zIndex: 1,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {editing ? "Edit Item" : "Add Marketplace Item"}
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
                    placeholder="E-commerce Dashboard Pro"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    placeholder="A production-ready dashboard with analytics, orders, and inventory management..."
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }}
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
                      placeholder="500000"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as MarketplaceCategory })}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {categoryOptions.map((c) => (
                        <option key={c} value={c} style={{ background: "#1a1a2e" }}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Tech stack (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tech}
                    onChange={(e) => setFormData({ ...formData, tech: e.target.value })}
                    placeholder="React, Next.js, TypeScript, Tailwind"
                    style={inputStyle}
                  />
                </div>

                {/* Images → R2 (up to 10) */}
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    Images — uploaded to Cloudflare R2 (max 10) {formData.images.length > 0 && <span style={{ color: "rgba(255,255,255,0.4)" }}>{formData.images.length}/10 · first = cover</span>}
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    style={{ display: "none" }}
                  />

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFilesSelected(e.dataTransfer.files);
                    }}
                    onClick={() => !uploadingImages && fileInputRef.current?.click()}
                    style={{
                      border: `1px dashed ${dragOver ? "#6366f1" : "rgba(255,255,255,0.15)"}`,
                      background: dragOver ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.03)",
                      borderRadius: 12,
                      padding: "18px 16px",
                      textAlign: "center",
                      cursor: uploadingImages ? "wait" : "pointer",
                      opacity: uploadingImages ? 0.7 : 1,
                    }}
                  >
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                      {uploadingImages ? "Uploading to R2..." : formData.images.length >= 10 ? "Limit reached (10/10) — remove one to add more" : "Drop images here or click to browse"}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                      PNG / JPG / WEBP · up to 5 MB each · auto-stored at R2 Public URL
                    </div>
                  </div>

                  {/* Thumbnails grid */}
                  {formData.images.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 12 }}>
                      {formData.images.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          style={{
                            position: "relative",
                            borderRadius: 10,
                            overflow: "hidden",
                            border: idx === 0 ? "2px solid #6366f1" : "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <img src={url} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                          {idx === 0 && (
                            <span style={{
                              position: "absolute", top: 4, left: 4,
                              padding: "2px 6px", borderRadius: 20,
                              background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 700,
                            }}>Cover</span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImageAt(idx)}
                            aria-label="Remove image"
                            style={{
                              position: "absolute", top: 4, right: 4,
                              width: 22, height: 22, borderRadius: "50%",
                              background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)",
                              color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 12, lineHeight: 1,
                            }}
                          >
                            ✕
                          </button>
                          <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", gap: 4 }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveImage(idx, idx - 1)}
                              style={{
                                flex: 1, padding: "3px 0", borderRadius: 6,
                                background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)",
                                color: idx === 0 ? "rgba(255,255,255,0.3)" : "#fff",
                                cursor: idx === 0 ? "not-allowed" : "pointer", fontSize: 11,
                              }}
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              disabled={idx === formData.images.length - 1}
                              onClick={() => moveImage(idx, idx + 1)}
                              style={{
                                flex: 1, padding: "3px 0", borderRadius: 6,
                                background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)",
                                color: idx === formData.images.length - 1 ? "rgba(255,255,255,0.3)" : "#fff",
                                cursor: idx === formData.images.length - 1 ? "not-allowed" : "pointer", fontSize: 11,
                              }}
                            >
                              →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fallback: paste R2 URL manually */}
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Or paste an R2 URL manually</summary>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input
                        type="url"
                        placeholder="https://pub-....r2.dev/marketplace/xxx.jpg"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = (e.target as HTMLInputElement).value.trim();
                            if (!v) return;
                            if (formData.images.length >= 10) { setError("Maximum 10 images"); return; }
                            setFormData((prev) => ({ ...prev, images: [...prev.images, v] }));
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", alignSelf: "center" }}>press Enter</span>
                    </div>
                  </details>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                      Demo URL
                    </label>
                    <input
                      type="url"
                      value={formData.demoUrl}
                      onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                      placeholder="https://demo.example.com"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                      Download / Purchase URL
                    </label>
                    <input
                      type="url"
                      value={formData.downloadUrl}
                      onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                      placeholder="https://gumroad.com/..."
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                    Featured (show first)
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MarketplaceStatus })}
                    style={{ ...inputStyle, cursor: "pointer", width: "auto", minWidth: 130 }}
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
                  disabled={saving || uploadingImages}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff",
                    border: "none",
                    cursor: saving || uploadingImages ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: saving || uploadingImages ? 0.7 : 1,
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
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#fff" }}>Delete Item</h3>
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
