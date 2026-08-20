import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";
import { FALLBACK_ROUTER_BASE } from "../../lib/routerBaseUrl";
import { toast } from "../../lib/toast";

const Chart = lazy(() => import("react-apexcharts"));

type CreditCustomer = { _id: string; customer_id: string; balance: number };
type CreditLog = { _id: string; credit_customer_id: string; credit_out: number; input_token: number; cached_token: number; output_token: number; model_name?: string; createdAt: string };
type Bucket = { credit_out: number; input_token: number; cached_token: number; output_token: number; total_tokens: number; count: number };
type SeriesPoint = Bucket & { date: string };
type Stats = { today: Bucket; yesterday: Bucket; weekly: Bucket; monthly: Bucket; allTime: Bucket; seriesWeek: SeriesPoint[]; seriesMonth: SeriesPoint[] };

export default function Usage() {
  const { t } = useTranslation();
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [credit, setCredit] = useState<CreditCustomer | null>(null);
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const routerBase = FALLBACK_ROUTER_BASE;

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardSoft = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const codeBg = isLight ? "#f5f5f4" : "#0f0f1a";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const subMuted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const faint = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setErr(""); setLoading(true);
        const meRes = await fetch("/api/router-customers/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!meRes.ok) throw new Error("Failed to load profile");
        const meData = await meRes.json();
        const u = meData.user ?? meData.router_customer;
        if (cancelled) return;
        setUserId(u.id);

        let cc: any = null;
        try {
          const ccRes = await fetch(`/api/credit-customers/by-customer/${u.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (ccRes.ok) cc = await ccRes.json();
        } catch { cc = null; }
        const ccDoc = cc?.credit_customer ?? cc;
        const normalized: CreditCustomer | null = ccDoc?._id ? ccDoc : ccDoc?.balance !== undefined ? ccDoc : null;
        if (cancelled) return;
        setCredit(normalized);

        if (normalized?._id) {
          const [logsRes, statsRes] = await Promise.all([
            fetch(`/api/credit-logs?credit_customer_id=${normalized._id}&limit=20&page=${page}`),
            fetch(`/api/credit-logs/stats?credit_customer_id=${normalized._id}`),
          ]);
          if (logsRes.ok) {
            const j = await logsRes.json();
            if (!cancelled) { setLogs(j.logs ?? []); setTotalLogs(j.total ?? 0); }
          }
          if (statsRes.ok) {
            const j = await statsRes.json();
            if (!cancelled) setStats(j);
          } else {
            if (!cancelled) setStats(null);
          }
        } else {
          setLogs([]); setTotalLogs(0); setStats(null);
        }
      } catch (e: any) { if (!cancelled) setErr(e.message || "Failed to load usage"); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [token, page, userId]);

  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const totalUsed = logs.reduce((a, l) => a + (l.credit_out || 0), 0);
  const totalTokens = logs.reduce((a, l) => a + (l.input_token || 0) + (l.cached_token || 0) + (l.output_token || 0), 0);
  const sumTokens = (b: Bucket | undefined) => b ? (b.input_token + b.cached_token + b.output_token) : 0;
  const totalPages = Math.max(1, Math.ceil(totalLogs / 20));
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast("Copied"); } catch { toast("Copy failed"); } };

  const seriesData = useMemo(() => {
    const pts = period === "week" ? stats?.seriesWeek : stats?.seriesMonth;
    if (!pts || pts.length === 0) return null;
    const labels = pts.map((p) => {
      const d = new Date(p.date + "T00:00:00");
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    });
    return {
      labels,
      credits: pts.map((p) => p.credit_out),
      tokens: pts.map((p) => p.total_tokens),
      inp: pts.map((p) => p.input_token),
      cached: pts.map((p) => p.cached_token),
      out: pts.map((p) => p.output_token),
      counts: pts.map((p) => p.count),
    };
  }, [stats, period]);

  if (loading) return <div style={{ color: muted, fontFamily: "DM Mono, monospace", fontSize: 13 }}>{t("customer.usage.loading")}</div>;

  const card = (label: string, value: string, sub: string, bg: string, bd: string) => (
    <div style={{ borderRadius: 16, padding: 18, background: bg, border: `1px solid ${bd}`, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
      <div style={{ fontSize: 11, color: muted, fontFamily: "DM Mono, monospace", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", marginTop: 6, color: fg }}>{value}</div>
      <div style={{ fontSize: 11, color: subMuted, fontFamily: "DM Mono, monospace", marginTop: 4 }}>{sub}</div>
    </div>
  );

  const n = (x: number | undefined) => (x ?? 0).toLocaleString();
  const chip = (active: boolean) => ({
    padding: "6px 12px",
    borderRadius: 20,
    border: `1px solid ${active ? "rgba(99,102,241,0.35)" : border}`,
    background: active ? "rgba(99,102,241,0.14)" : isLight ? "#fff" : "rgba(255,255,255,0.04)",
    color: active ? (isLight ? "#4f46e5" : "#a5b4fc") : fg,
    fontFamily: "DM Mono, monospace" as const,
    fontSize: 11,
    cursor: "pointer",
    fontWeight: active ? 700 : 400,
  });

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    borderRadius: 10,
    border: `1px solid ${active ? "rgba(99,102,241,0.35)" : border}`,
    background: active ? (isLight ? "#fff" : "rgba(99,102,241,0.14)") : "transparent",
    color: active ? (isLight ? "#4f46e5" : "#a5b4fc") : muted,
    fontFamily: "Space Grotesk, sans-serif",
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: active && isLight ? "0 1px 8px rgba(99,102,241,0.12)" : "none",
  });

  // ApexCharts options — theme-aware, no extra dep beyond apexcharts
  const apexOptsCredits: any = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "DM Mono, monospace" },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2.5, colors: ["#6366f1"] },
    fill: { type: "gradient", gradient: { shadeIntensity: 0.4, opacityFrom: 0.35, opacityTo: 0.02, colorStops: [{ offset: 0, color: "#6366f1", opacity: 0.35 }, { offset: 100, color: "#6366f1", opacity: 0.02 }] } },
    colors: ["#6366f1"],
    grid: { borderColor: faint, strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { left: 8, right: 8 } },
    xaxis: { categories: seriesData?.labels ?? [], labels: { style: { colors: subMuted, fontSize: "11px", fontFamily: "DM Mono, monospace" } }, axisBorder: { color: faint }, axisTicks: { color: faint } },
    yaxis: { labels: { style: { colors: subMuted, fontSize: "11px" }, formatter: (v: number) => Math.round(v).toLocaleString() }, min: 0 },
    tooltip: { theme: isLight ? "light" : "dark", x: { show: true }, y: { formatter: (v: number) => `${Math.round(v).toLocaleString()} credits` } },
    markers: { size: 0, hover: { size: 5 } },
  };
  const apexOptsTokens: any = {
    chart: { type: "bar", stacked: true, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "DM Mono, monospace" },
    plotOptions: { bar: { columnWidth: period === "week" ? "42%" : "62%", borderRadius: 4 } },
    dataLabels: { enabled: false },
    colors: ["#6366f1", "#06b6d4", "#10b981"],
    grid: { borderColor: faint, strokeDashArray: 4, padding: { left: 8, right: 8 } },
    xaxis: { categories: seriesData?.labels ?? [], labels: { style: { colors: subMuted, fontSize: "11px", fontFamily: "DM Mono, monospace" } }, axisBorder: { color: faint }, axisTicks: { color: faint } },
    yaxis: { labels: { style: { colors: subMuted, fontSize: "11px" }, formatter: (v: number) => Math.round(v).toLocaleString() }, min: 0 },
    legend: { position: "top", horizontalAlign: "right", fontSize: "11px", fontFamily: "DM Mono, monospace", labels: { colors: muted }, markers: { size: 8 } },
    tooltip: { theme: isLight ? "light" : "dark", shared: true, intersect: false, y: { formatter: (v: number) => `${Math.round(v).toLocaleString()} tokens` } },
  };

  return (
    <div style={{ display: "grid", gap: 16, color: fg }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 800, color: fg }}>{t("customer.usage.title")}</h2>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, border: `1px solid ${border}`, padding: "5px 10px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)" }} title={routerBase}>{t("customer.usage.baseUrlBadge", { base: routerBase.replace(/^https?:\/\//, "") })}</span>
        <button onClick={() => token && copy(token)} style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: 11, padding: "7px 11px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>{t("customer.common.copyToken")}</button>
      </div>

      {err && <div role="alert" style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: isLight ? "#9f1239" : "#fecaca", fontFamily: "DM Mono, monospace", fontSize: 13 }}>{err}</div>}

      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${faint}`, paddingBottom: 12 }}>
        <button onClick={() => setTab("overview")} style={tabBtn(tab === "overview")}>{t("customer.usage.tabOverview")}</button>
        <button onClick={() => setTab("history")} style={tabBtn(tab === "history")}>{t("customer.usage.tabHistory")}</button>
      </div>

      {tab === "overview" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }} className="usage-stats">
            {card(t("customer.usage.creditBalance"), credit?.balance?.toLocaleString?.() ?? "0", t("customer.usage.availableCredits"), isLight ? "#fff" : "linear-gradient(135deg, rgba(99,102,241,0.16), rgba(139,92,246,0.06))", isLight ? "rgba(99,102,241,0.18)" : "rgba(99,102,241,0.22)")}
            {card(t("customer.usage.creditsUsedPage"), totalUsed.toLocaleString(), t("customer.usage.totalRequests", { count: totalLogs }), isLight ? "#fff" : "linear-gradient(135deg, rgba(6,182,214,0.14), rgba(6,182,214,0.04))", isLight ? "rgba(6,182,214,0.18)" : "rgba(6,182,214,0.22)")}
            {card(t("customer.usage.tokensPage"), totalTokens.toLocaleString(), t("customer.usage.tokenBreakdown"), isLight ? "#fff" : "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.04))", isLight ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.22)")}
          </div>

      {/* Period cards: Today / Yesterday / Weekly / Monthly */}
      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardSoft, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: fg }}>{t("customer.usage.periodStatsTitle")}</h3>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted }}>{t("customer.usage.periodStatsHint")}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }} className="usage-periods">
          {([
            ["today", stats?.today],
            ["yesterday", stats?.yesterday],
            ["weekly", stats?.weekly],
            ["monthly", stats?.monthly],
          ] as const).map(([key, b]) => (
            <div key={key} style={{ padding: 16, borderRight: key !== "monthly" ? `1px solid ${faint}` : undefined }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: subMuted, textTransform: "uppercase" }}>{t(`customer.usage.${key}` as any)}</div>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: muted }}>{t("customer.usage.credits")}</div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 18, color: fg }}>{n(b?.credit_out)}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted }}>{n(b?.count)} req</div>
                </div>
                <div style={{ height: 1, background: faint }} />
                <div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 10, color: muted }}>{t("customer.usage.tokens")}</div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 18, color: fg }}>{n(b ? sumTokens(b) : 0)}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted }}>
                    {n(b?.input_token)} in · {n(b?.cached_token)} cache · {n(b?.output_token)} out
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ApexCharts: usage by period */}
      <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardSoft, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: fg }}>{t("customer.usage.chartTitle")}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPeriod("week")} style={chip(period === "week")}>{t("customer.usage.weekly")}</button>
            <button onClick={() => setPeriod("month")} style={chip(period === "month")}>{t("customer.usage.monthly")}</button>
          </div>
        </div>
        {!seriesData ? (
          <div style={{ padding: 28, textAlign: "center", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 13 }}>{t("customer.usage.noUsage")}</div>
        ) : (
          <div style={{ padding: "8px 12px 4px" }}>
            <Suspense fallback={<div style={{ height: 220, display: "grid", placeItems: "center", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>Loading chart…</div>}>
              <Chart options={apexOptsCredits} series={[{ name: "Credits", data: seriesData.credits }]} type="area" height={220} />
            </Suspense>
            <div style={{ height: 1, background: faint, margin: "4px 0 12px" }} />
            <Suspense fallback={<div style={{ height: 240, display: "grid", placeItems: "center", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 12 }}>Loading chart…</div>}>
              <Chart
                options={apexOptsTokens}
                series={[
                  { name: "Input", data: seriesData.inp },
                  { name: "Cached", data: seriesData.cached },
                  { name: "Output", data: seriesData.out },
                ]}
                type="bar"
                height={240}
              />
            </Suspense>
          </div>
        )}
      </div>

          {/* token totals card — total input / cached / output */}
          <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardSoft, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13, color: fg }}>{t("customer.usage.tokenTotalsTitle")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }} className="usage-totals">
              {([
                ["input", stats?.allTime?.input_token ?? 0, "rgba(99,102,241,0.12)", "rgba(99,102,241,0.22)"],
                ["cached", stats?.allTime?.cached_token ?? 0, "rgba(6,182,214,0.10)", "rgba(6,182,214,0.20)"],
                ["output", stats?.allTime?.output_token ?? 0, "rgba(16,185,129,0.10)", "rgba(16,185,129,0.20)"],
                ["total", (stats?.allTime ? sumTokens(stats.allTime) : 0), "rgba(245,158,11,0.10)", "rgba(245,158,11,0.20)"],
              ] as const).map(([label, val, bg, bd]) => (
                <div key={label} style={{ padding: 16, background: isLight ? bg : "transparent", borderRight: label !== "total" ? `1px solid ${faint}` : undefined, borderTop: `1px solid ${isLight ? bd : "transparent"}` }}>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: subMuted, textTransform: "uppercase" }}>{t(`customer.usage.${label}Tokens` as any)}</div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: fg, marginTop: 8 }}>{n(val as number)}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: subMuted, marginTop: 4 }}>{t("customer.usage.allTime")}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: cardSoft, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
            <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${border}`, gap: 12, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: fg }}>{t("customer.usage.recentUsage")}</h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "DM Mono, monospace", fontSize: 12, color: muted }}>
                <span>{t("customer.usage.pageXofY", { page, total: totalPages })}</span>
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: page <= 1 ? "transparent" : isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}>{t("customer.usage.prev")}</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: page >= totalPages ? "transparent" : isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1 }}>{t("customer.usage.next")}</button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.6, color: subMuted, borderBottom: `1px solid ${faint}` }}>
                    <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.usage.colDate")}</th>
                    <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.usage.colCreditOut")}</th>
                    <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.usage.colInput")}</th>
                    <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.usage.colCached")}</th>
                    <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.usage.colOutput")}</th>
                    <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.usage.colModel")}</th>
                    <th style={{ padding: "10px 14px", fontWeight: 500 }}>{t("customer.usage.colTotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 28, textAlign: "center", color: subMuted, fontFamily: "DM Mono, monospace", fontSize: 13 }}>{t("customer.usage.noUsage")}</td></tr>
                  ) : logs.map(l => (
                    <tr key={l._id} style={{ borderBottom: `1px solid ${faint}` }}>
                      <td style={{ padding: "11px 14px", color: muted, whiteSpace: "nowrap" }}>{fmtDate(l.createdAt)}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: fg }}>{Number(l.credit_out).toLocaleString()}</td>
                      <td style={{ padding: "11px 14px", color: muted }}>{Number(l.input_token).toLocaleString()}</td>
                      <td style={{ padding: "11px 14px", color: muted }}>{Number(l.cached_token).toLocaleString()}</td>
                      <td style={{ padding: "11px 14px", color: muted }}>{Number(l.output_token).toLocaleString()}</td>
                      <td style={{ padding: "11px 14px", color: muted, fontFamily: "DM Mono, monospace", fontSize: 11 }}>{(l as any).model_name || "—"}</td>
                      <td style={{ padding: "11px 14px", color: muted, fontFamily: "DM Mono, monospace" }}>{(Number(l.input_token) + Number(l.cached_token) + Number(l.output_token)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ borderRadius: 16, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.03)", padding: 14, boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: 11, letterSpacing: 0.8, color: subMuted, marginBottom: 10 }}>{t("customer.usage.quickStart")}</div>
            <pre style={{ margin: 0, padding: 12, borderRadius: 12, background: codeBg, border: `1px solid ${faint}`, overflowX: "auto", fontFamily: "DM Mono, monospace", fontSize: 12, lineHeight: 1.6, color: isLight ? "#1c1917" : "#e0e7ff" }}>
{`curl ${routerBase}/chat/completions \\
  -H "X-Api-Key: sk-..." \\
  -H "Content-Type: application/json" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`}
            </pre>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button onClick={() => copy(`curl ${routerBase}/chat/completions -H "X-Api-Key: sk-..." -H "Content-Type: application/json" -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`)} style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}>{t("customer.usage.copySnippet")}</button>
              <Link to="/dashboard/documentation" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.15)", color: "#6366f1", textDecoration: "none" }}>{t("customer.usage.docsLink")}</Link>
            </div>
          </div>
        </>
      )}
      <style>{`@media(max-width: 860px){ .usage-stats{ grid-template-columns: 1fr !important; } .usage-periods{ grid-template-columns: 1fr 1fr !important; } .usage-totals{ grid-template-columns: 1fr 1fr !important; } }`}</style>
    </div>
  );
}
