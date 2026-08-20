import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";
import { toast } from "../../lib/toast";

type Msg = { role: "user" | "assistant"; content: string };
type RouterModelOpt = {
  _id: string;
  name: string;
  provider: string;
  model_id: string;
  base_url: string;
  credits_per_1k?: number;
};

export default function Chat() {
  const { t } = useTranslation();
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: t("customer.chat.greeting"),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const [models, setModels] = useState<RouterModelOpt[]>([]);
  const [selected, setSelected] = useState<string>("auto");
  const [balance, setBalance] = useState<number | null>(null);
  const [lastCreditOut, setLastCreditOut] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";
  const shellBg = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const formBg = isLight ? "rgba(248,247,245,0.9)" : "rgba(10,10,20,0.6)";
  const inputBg = isLight ? "#fff" : "#0f0f1a";



  const fetchModels = async () => {
    try {
      const r = await fetch("/api/router-customers/chat/models");
      if (!r.ok) {
        toast(`Models refresh failed (${r.status})`);
        return;
      }
      const j = await r.json();
      const rows: RouterModelOpt[] = j.models ?? j.router_models ?? [];
      setModels(rows);
      if (rows.length === 0) toast("No active models");
    } catch {
      toast("Models refresh failed");
    }
  };
  const fetchBalance = async () => {
    if (!token) {
      toast("No token — please log in again");
      return;
    }
    try {
      const meRes = await fetch("/api/router-customers/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) {
        toast(`Balance refresh failed (${meRes.status})`);
        return;
      }
      const me = await meRes.json();
      const uid = (me.user ?? me.router_customer)?.id;
      if (!uid) {
        toast("Balance refresh failed — invalid profile");
        return;
      }
      const ccRes = await fetch(`/api/credit-customers/by-customer/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!ccRes.ok) {
        setBalance(0);
        toast("Balance: 0");
        return;
      }
      const cc = await ccRes.json();
      const doc = cc.credit_customer ?? cc;
      setBalance(typeof doc.balance === "number" ? doc.balance : 0);
    } catch {
      setBalance(null);
      toast("Balance refresh failed");
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setErr("");
    try {
      await Promise.all([fetchModels(), fetchBalance()]);
      toast("Refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModels();
    fetchBalance();
  }, []);
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);
  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); toast("Copied"); } catch { toast("Copy failed"); }
  };

  const send = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setErr("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/router-customers/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "X-Alvine-Credits": "1",
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selected,
          stream: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let msg =
          data.error || data.message || `Request failed (${res.status})`;
        // collapse HTML dumps (upstream 404 returned Next.js page) — already fixed server side but guard here too
        if (/<!DOCTYPE|<html/i.test(msg))
          msg =
            data.error?.slice?.(0, 900) ||
            `Upstream ${data.upstream_status ?? res.status}: base_url misconfigured — see Admin → Router Models`;
        if (res.status === 502 && data.tried)
          msg = `${msg} — tried: ${data.tried.join(", ")}`;
        if (res.status === 402)
          throw new Error(
            `${msg} — balance: ${data.balance ?? balance ?? 0}. ${t("customer.chat.topUp")}`,
          );
        if (res.status === 503)
          throw new Error(
            msg + " " + t("customer.chat.adminRouterModels"),
          );
        throw new Error(msg.length > 1200 ? msg.slice(0, 1200) + "…" : msg);
      }

      // ── SSE stream ──
      const ct = res.headers.get("content-type") || "";
      if (
        !ct.includes("text/event-stream") &&
        !ct.includes("text/plain") &&
        !ct.includes("application/x-ndjson")
      ) {
        // server fell back to non-stream JSON — handle as before
        const data = await res.json().catch(() => ({}));
        let normalized: any = data;
        if (
          data &&
          typeof data === "object" &&
          (data as any)._raw &&
          typeof (data as any)._raw === "string"
        ) {
          const raw = String((data as any)._raw)
            .trim()
            .replace(/\s*data:\s*\[DONE\]\s*$/i, "")
            .trim();
          try {
            normalized = JSON.parse(
              raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1),
            );
          } catch {
            normalized = data;
          }
          if ((data as any)._credits)
            (normalized as any)._credits = (data as any)._credits;
        }
        if (
          normalized &&
          typeof normalized === "object" &&
          normalized.choices === undefined
        ) {
          const inner = (normalized as any).data ?? normalized;
          if (inner?.choices) normalized = inner;
        }
        const rawContent =
          normalized.choices?.[0]?.message?.content ??
          (normalized as any).content ??
          (normalized as any).reply ??
          (normalized as any).message;
        const reply =
          rawContent != null && String(rawContent).trim() !== ""
            ? String(rawContent)
            : normalized._raw
              ? String(normalized._raw)
                  .replace(/\s*data:\s*\[DONE\]\s*$/i, "")
                  .trim()
                  .slice(0, 2000)
              : JSON.stringify(normalized, null, 2);
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        if ((normalized as any)._credits) {
          if (typeof (normalized as any)._credits.balance === "number")
            setBalance((normalized as any)._credits.balance);
          if (typeof (normalized as any)._credits.credit_out === "number")
            setLastCreditOut((normalized as any)._credits.credit_out);
        } else if ((data as any)._credits) {
          if (typeof (data as any)._credits.balance === "number")
            setBalance((data as any)._credits.balance);
          if (typeof (data as any)._credits.credit_out === "number")
            setLastCreditOut((data as any)._credits.credit_out);
        } else {
          fetchBalance();
        }
        return;
      }

      // SSE: read the body as a stream, parse `data:` lines, append content live
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming response unavailable");
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      let creditsEvent: any = null;
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      const flushLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) return;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") return;
        try {
          const ev = JSON.parse(payload);
          if (ev && ev._credits) {
            creditsEvent = ev._credits;
            return;
          }
          const piece =
            ev?.choices?.[0]?.delta?.content ??
            ev?.choices?.[0]?.message?.content ??
            ev?.content ??
            ev?.reply ??
            "";
          if (piece && typeof piece === "string") {
            assistantContent += piece;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                role: "assistant",
                content: assistantContent,
              };
              return copy;
            });
          }
        } catch {}
      };

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.trim() === "") continue;
          flushLine(line);
        }
      }
      // flush any trailing partial line
      if (buffer.trim()) flushLine(buffer);
      if (!assistantContent) {
        // no content pieces — show whatever the last message was or a placeholder
        setMessages((m) => {
          const copy = [...m];
          if (
            copy[copy.length - 1]?.role === "assistant" &&
            !copy[copy.length - 1].content
          ) {
            copy[copy.length - 1] = { role: "assistant", content: "—" };
          }
          return copy;
        });
      }
      if (creditsEvent) {
        if (typeof creditsEvent.balance === "number")
          setBalance(creditsEvent.balance);
        if (typeof creditsEvent.credit_out === "number")
          setLastCreditOut(creditsEvent.credit_out);
      } else {
        fetchBalance();
      }
    } catch (e: any) {
      const msg = e.message || "Failed to send";
      setErr(msg);
      if (
        /404|Failed to fetch|NetworkError/i.test(msg) &&
        models.length === 0
      ) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              t("customer.chat.noModelError"),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 88px)",
        minHeight: 520,
        borderRadius: 16,
        border: `1px solid ${border}`,
        background: shellBg,
        overflow: "hidden",
        boxShadow: isLight ? "0 1px 14px rgba(0,0,0,0.06)" : "none",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          background: isLight ? "#fff" : "transparent",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 10px rgba(16,185,129,0.5)",
          }}
        />
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 11,
            letterSpacing: 0.8,
            color: muted,
          }}
        >
          {t("customer.chat.chat")}
        </span>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 11,
            padding: "6px 8px",
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: isLight ? "#fff" : "#0f0f1a",
            color: fg,
            outline: "none",
            maxWidth: 220,
          }}
        >
          <option value="auto">auto — best active</option>
          {models.map((m) => (
            <option key={m._id} value={m.model_id}>
              {m.name}
            </option>
          ))}
        </select>
        {models.length === 0 && (
          <span
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 11,
              color: "#f59e0b",
            }}
          >
            {t("customer.chat.noModels")}
          </span>
        )}
        <span
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 11,
            padding: "5px 8px",
            borderRadius: 20,
            border: `1px solid ${border}`,
            background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
            color: balance !== null && balance < 5 ? "#ef4444" : fg,
          }}
        >
          credits: {balance === null ? "—" : balance.toLocaleString()}{" "}
          {lastCreditOut !== null ? `· last −${lastCreditOut}` : ""}
        </span>
        <button
          onClick={() => token && copy(token)}
          style={{
            marginLeft: "auto",
            fontFamily: "DM Mono, monospace",
            fontSize: 11,
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: isLight ? "#fff" : "rgba(255,255,255,0.06)",
            color: fg,
            cursor: "pointer",
          }}
        >
          {t("customer.common.copyToken")}
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          aria-busy={refreshing}
          style={{
            fontFamily: "DM Mono, monospace",
            fontSize: 11,
            padding: "6px 10px",
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: isLight ? "#fff" : "rgba(255,255,255,0.06)",
            color: fg,
            cursor: refreshing ? "not-allowed" : "pointer",
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          {refreshing ? `${t("customer.apiKeys.refresh")}…` : t("customer.apiKeys.refresh")}
        </button>
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "grid",
          gap: 12,
          alignContent: "start",
          background: isLight
            ? "linear-gradient(180deg, rgba(99,102,241,0.04), transparent 22%)"
            : "linear-gradient(180deg, rgba(99,102,241,0.04), transparent 22%)",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "10px 13px",
                borderRadius: 14,
                border: `1px solid ${border}`,
                background:
                  m.role === "user"
                    ? "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(6,182,214,0.14))"
                    : isLight
                      ? "#f5f5f4"
                      : "rgba(255,255,255,0.04)",
                color: m.role === "user" ? (isLight ? "#1e1b4b" : "#fff") : fg,
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                boxShadow:
                  m.role === "user"
                    ? "0 4px 16px rgba(99,102,241,0.15)"
                    : "none",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 12,
              color: muted,
              padding: "4px 2px",
            }}
          >
            {t("customer.chat.thinking")}
          </div>
        )}
      </div>

      {err && (
        <div
          role="alert"
          style={{
            margin: "0 16px",
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.22)",
            color: isLight ? "#9f1239" : "#fecaca",
            fontFamily: "DM Mono, monospace",
            fontSize: 12,
          }}
        >
          {err}
        </div>
      )}

      <form
        onSubmit={send}
        style={{
          padding: 12,
          borderTop: `1px solid ${border}`,
          background: formBg,
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t("customer.chat.placeholder")}
          rows={1}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 140,
            padding: "11px 13px",
            borderRadius: 12,
            border: `1px solid ${border}`,
            background: inputBg,
            color: fg,
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            resize: "none",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "11px 18px",
            borderRadius: 12,
            border: "1px solid rgba(99,102,241,0.35)",
            background:
              loading || !input.trim()
                ? isLight
                  ? "rgba(0,0,0,0.06)"
                  : "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg,#6366f1,#06b6d4)",
            color: loading || !input.trim() ? muted : "#fff",
            fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 13,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {t("customer.chat.send")}
        </button>
      </form>
    </div>
  );
}
