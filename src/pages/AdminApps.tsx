import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "../components/AdminLayout";
import "./AdminApps.css";

type Locale = "en" | "id" | "zh";
type AppStatus = "active" | "inactive";
type LocalizedText = Record<Locale, string>;
type LocalizedResults = Record<Locale, string[]>;

interface PortfolioApp {
  _id: string;
  slug: string;
  title: LocalizedText;
  category: LocalizedText;
  description: LocalizedText;
  problem: LocalizedText;
  solution: LocalizedText;
  timeline: LocalizedText;
  results: LocalizedResults;
  tech: string[];
  image: string;
  liveUrl: string;
  status: AppStatus;
  sortOrder: number;
}

interface AppForm {
  slug: string;
  title: LocalizedText;
  category: LocalizedText;
  description: LocalizedText;
  problem: LocalizedText;
  solution: LocalizedText;
  timeline: LocalizedText;
  results: Record<Locale, string>;
  tech: string;
  image: string;
  liveUrl: string;
  status: AppStatus;
  sortOrder: string;
}

interface ListResponse {
  apps: PortfolioApp[];
  total: number;
  activeCount: number;
  inactiveCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LOCALES: Locale[] = ["en", "id", "zh"];
const PAGE_SIZE = 10;
const emptyLocalized = (): LocalizedText => ({ en: "", id: "", zh: "" });
const slugFromTitle = (title: string) => title.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const emptyForm = (): AppForm => ({
  slug: "",
  title: emptyLocalized(),
  category: emptyLocalized(),
  description: emptyLocalized(),
  problem: emptyLocalized(),
  solution: emptyLocalized(),
  timeline: emptyLocalized(),
  results: { en: "", id: "", zh: "" },
  tech: "",
  image: "",
  liveUrl: "",
  status: "active",
  sortOrder: "0",
});

export default function AdminApps() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PortfolioApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<AppStatus>("active");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PortfolioApp | null>(null);
  const [form, setForm] = useState<AppForm>(emptyForm);
  const [locale, setLocale] = useState<Locale>("en");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<PortfolioApp | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab, page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const response = await fetch(`/api/portfolio-apps/admin?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("adminApps.errors.load"));
      const result = data as ListResponse;
      setRows(result.apps);
      setTotal(result.total);
      setActiveCount(result.activeCount);
      setInactiveCount(result.inactiveCount);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (e) {
      console.error("Error fetching portfolio apps:", e);
      setError(e instanceof Error ? e.message : t("adminApps.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [tab, page, debouncedSearch, t]);

  useEffect(() => {
    const trimmed = search.trim();
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setLocale("en");
    setError("");
    setShowModal(true);
  };

  const openEdit = (app: PortfolioApp) => {
    setEditing(app);
    setForm({
      slug: app.slug,
      title: { ...emptyLocalized(), ...app.title },
      category: { ...emptyLocalized(), ...app.category },
      description: { ...emptyLocalized(), ...app.description },
      problem: { ...emptyLocalized(), ...app.problem },
      solution: { ...emptyLocalized(), ...app.solution },
      timeline: { ...emptyLocalized(), ...app.timeline },
      results: {
        en: app.results?.en?.join("\n") || "",
        id: app.results?.id?.join("\n") || "",
        zh: app.results?.zh?.join("\n") || "",
      },
      tech: app.tech.join(", "),
      image: app.image,
      liveUrl: app.liveUrl,
      status: app.status,
      sortOrder: String(app.sortOrder),
    });
    setLocale("en");
    setError("");
    setShowModal(true);
  };

  const updateLocalized = (field: keyof Pick<AppForm, "title" | "category" | "description" | "problem" | "solution" | "timeline" | "results">, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: { ...current[field], [locale]: value },
      ...(field === "title" && locale === "en" ? { slug: slugFromTitle(value) } : {}),
    }));
  };

  const uploadImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("adminApps.errors.imageType"));
      return;
    }
    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/portfolio-apps/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("adminApps.errors.upload"));
      setForm((current) => ({ ...current, image: data.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminApps.errors.upload"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder) || 0,
      tech: form.tech.split(",").map((value) => value.trim()).filter(Boolean),
      results: Object.fromEntries(LOCALES.map((key) => [key, form.results[key].split("\n").map((value) => value.trim()).filter(Boolean)])),
    };
    try {
      const response = await fetch(editing ? `/api/portfolio-apps/${editing._id}` : "/api/portfolio-apps", {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("adminApps.errors.save"));
      setShowModal(false);
      await fetchRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminApps.errors.save"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const response = await fetch(`/api/portfolio-apps/${deleteConfirm._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("adminApps.errors.delete"));
      setDeleteConfirm(null);
      await fetchRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adminApps.errors.delete"));
    }
  };

  const inputClass = "apps-input";

  return (
    <AdminLayout>
      <div className="apps-page">
        <header className="apps-header">
          <div>
            <h2>{t("adminApps.title")}</h2>
            <p>{t("adminApps.subtitle")}</p>
          </div>
          <button className="apps-primary-button" onClick={openCreate} type="button">＋ {t("adminApps.addApp")}</button>
        </header>

        <div className="apps-toolbar">
          <div className="apps-tabs" role="tablist" aria-label={t("adminApps.statusFilter")}>
            {(["active", "inactive"] as const).map((status) => (
              <button key={status} type="button" role="tab" aria-selected={tab === status} className={tab === status ? "selected" : ""} onClick={() => { setTab(status); setPage(1); }}>
                {t(`adminApps.${status}`)} <span>{status === "active" ? activeCount : inactiveCount}</span>
              </button>
            ))}
          </div>
          <input className="apps-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("adminApps.searchPlaceholder")} aria-label={t("adminApps.searchPlaceholder")} />
        </div>

        {error && !showModal && <div className="apps-alert" role="alert">{error}</div>}
        <div className="apps-list" aria-live="polite">
          {loading ? <div className="apps-empty">{t("adminApps.loading")}</div> : rows.length === 0 ? <div className="apps-empty">{t("adminApps.empty")}</div> : rows.map((app) => (
            <article className="apps-row" key={app._id}>
              {app.image ? <img src={app.image} alt="" className="apps-thumb" /> : <div className="apps-thumb apps-placeholder">{app.title.en.charAt(0).toUpperCase()}</div>}
              <div className="apps-row-main">
                <div className="apps-row-title"><strong>{app.title.en}</strong><span className={`apps-status ${app.status}`}>{t(`adminApps.${app.status}`)}</span></div>
                <p>{app.slug} · {app.tech.join(", ") || t("adminApps.noTech")}</p>
              </div>
              <div className="apps-row-actions">
                {app.liveUrl && <a href={app.liveUrl} target="_blank" rel="noreferrer" className="apps-link">{t("adminApps.viewLive")}</a>}
                <button type="button" onClick={() => openEdit(app)}>{t("adminApps.edit")}</button>
                <button type="button" className="danger" onClick={() => setDeleteConfirm(app)}>{t("adminApps.delete")}</button>
              </div>
            </article>
          ))}
        </div>

        {!loading && rows.length > 0 && <nav className="apps-pagination" aria-label={t("adminApps.pagination")}>
          <span>{t("adminApps.pageOf", { page, totalPages, total })}</span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t("adminApps.previous")}</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>{t("adminApps.next")}</button>
          </div>
        </nav>}
      </div>

      {showModal && <div className="apps-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowModal(false); }}>
        <section className="apps-modal" role="dialog" aria-modal="true" aria-labelledby="apps-modal-title">
          <header className="apps-modal-header"><h2 id="apps-modal-title">{editing ? t("adminApps.editApp") : t("adminApps.createApp")}</h2><button type="button" aria-label={t("adminApps.close")} onClick={() => setShowModal(false)}>×</button></header>
          <form onSubmit={handleSubmit} className="apps-form">
            <div className="apps-field"><label htmlFor="app-slug">{t("adminApps.slug")}</label><input id="app-slug" className={inputClass} required readOnly value={form.slug} placeholder="my-project" /></div>
            <div className="apps-locale-tabs" role="tablist" aria-label={t("adminApps.contentLanguage")}>
              {LOCALES.map((item) => <button type="button" role="tab" aria-selected={locale === item} className={locale === item ? "selected" : ""} key={item} onClick={() => setLocale(item)}>{t(`adminApps.locales.${item}`)}</button>)}
            </div>
            <div className="apps-field"><label htmlFor="app-title">{t("adminApps.projectTitle")} · {t(`adminApps.locales.${locale}`)}</label><input id="app-title" className={inputClass} required={locale === "en"} value={form.title[locale]} onChange={(event) => updateLocalized("title", event.target.value)} placeholder={t("adminApps.placeholders.title")} /></div>
            <div className="apps-field"><label htmlFor="app-category">{t("adminApps.category")}</label><input id="app-category" className={inputClass} value={form.category[locale]} onChange={(event) => updateLocalized("category", event.target.value)} placeholder={t("adminApps.placeholders.category")} /></div>
            <div className="apps-field"><label htmlFor="app-description">{t("adminApps.description")}</label><textarea id="app-description" className={inputClass} rows={3} value={form.description[locale]} onChange={(event) => updateLocalized("description", event.target.value)} placeholder={t("adminApps.placeholders.description")} /></div>
            <div className="apps-field"><label htmlFor="app-problem">{t("adminApps.problem")}</label><textarea id="app-problem" className={inputClass} rows={2} value={form.problem[locale]} onChange={(event) => updateLocalized("problem", event.target.value)} placeholder={t("adminApps.placeholders.problem")} /></div>
            <div className="apps-field"><label htmlFor="app-solution">{t("adminApps.solution")}</label><textarea id="app-solution" className={inputClass} rows={2} value={form.solution[locale]} onChange={(event) => updateLocalized("solution", event.target.value)} placeholder={t("adminApps.placeholders.solution")} /></div>
            <div className="apps-field"><label htmlFor="app-timeline">{t("adminApps.timeline")}</label><input id="app-timeline" className={inputClass} value={form.timeline[locale]} onChange={(event) => updateLocalized("timeline", event.target.value)} placeholder={t("adminApps.placeholders.timeline")} /></div>
            <div className="apps-field"><label htmlFor="app-results">{t("adminApps.results")}</label><textarea id="app-results" className={inputClass} rows={3} value={form.results[locale]} onChange={(event) => updateLocalized("results", event.target.value)} placeholder={t("adminApps.placeholders.results")} /><small>{t("adminApps.resultsHint")}</small></div>
            <div className="apps-field"><label htmlFor="app-tech">{t("adminApps.technologies")}</label><input id="app-tech" className={inputClass} value={form.tech} onChange={(event) => setForm({ ...form, tech: event.target.value })} placeholder={t("adminApps.placeholders.technologies")} /></div>
            <div className="apps-field"><label>{t("adminApps.coverImage")}</label><input ref={fileInputRef} type="file" accept="image/*" onChange={(event) => void uploadImage(event.target.files?.[0])} hidden /><div className="apps-image-upload">
              {form.image && <img src={form.image} alt={t("adminApps.coverPreview")} />}
              <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>{uploading ? t("adminApps.uploading") : t("adminApps.chooseImage")}</button>
              <input className={inputClass} aria-label={t("adminApps.imageUrl")} type="url" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder={t("adminApps.placeholders.imageUrl")} />
            </div></div>
            <div className="apps-field"><label htmlFor="app-live-url">{t("adminApps.liveUrl")}</label><input id="app-live-url" className={inputClass} type="url" value={form.liveUrl} onChange={(event) => setForm({ ...form, liveUrl: event.target.value })} placeholder="https://example.com" /></div>
            <div className="apps-form-grid">
              <div className="apps-field"><label htmlFor="app-sort">{t("adminApps.sortOrder")}</label><input id="app-sort" className={inputClass} type="text" inputMode="numeric" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value.replace(/\D/g, "") })} placeholder="0" /></div>
              <div className="apps-field"><label htmlFor="app-status">{t("adminApps.status")}</label><select id="app-status" className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AppStatus })}><option value="active">{t("adminApps.active")}</option><option value="inactive">{t("adminApps.inactive")}</option></select></div>
            </div>
            {error && <div className="apps-alert" role="alert">{error}</div>}
            <footer className="apps-form-actions"><button type="button" className="apps-secondary-button" onClick={() => setShowModal(false)}>{t("adminApps.cancel")}</button><button type="submit" className="apps-primary-button" disabled={saving || uploading}>{saving ? t("adminApps.saving") : t("adminApps.save")}</button></footer>
          </form>
        </section>
      </div>}

      {deleteConfirm && <div className="apps-overlay"><section className="apps-confirm" role="alertdialog" aria-modal="true" aria-labelledby="apps-delete-title"><h2 id="apps-delete-title">{t("adminApps.confirmDeleteTitle")}</h2><p>{t("adminApps.confirmDelete", { name: deleteConfirm.title.en })}</p><footer className="apps-form-actions"><button type="button" className="apps-secondary-button" onClick={() => setDeleteConfirm(null)}>{t("adminApps.cancel")}</button><button type="button" className="apps-danger-button" onClick={() => void handleDelete()}>{t("adminApps.delete")}</button></footer></section></div>}
    </AdminLayout>
  );
}
