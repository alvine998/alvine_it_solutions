import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCustomerTheme } from "../../hooks/useCustomerTheme";
import { FALLBACK_ROUTER_BASE, fetchActiveRouterBase } from "../../lib/routerBaseUrl";
import { toast } from "../../lib/toast";

export default function Integration() {
  const { t } = useTranslation();
  const { theme } = useCustomerTheme();
  const isLight = theme === "light";
  const [base, setBase] = useState(FALLBACK_ROUTER_BASE);
  const [active, setActive] = useState("curl");
  useEffect(() => { fetchActiveRouterBase().then(b => { if (b) setBase(b); }); }, []);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authVal = token || "$TOKEN";

  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const cardBg = isLight ? "#fff" : "rgba(255,255,255,0.02)";
  const codeBg = isLight ? "#f5f5f4" : "#0f0f1a";
  const fg = isLight ? "#1c1917" : "#fff";
  const muted = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const inactiveTab = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)";
  const accent = "#6366f1";

  const copy = async (code: string) => { try { await navigator.clipboard.writeText(code); toast("Copied"); } catch { toast("Copy failed"); } };
  const snippet: Record<string, string> = {
    curl: `curl ${base}/chat/completions \\
  -H "Authorization: Bearer ${authVal}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`,
    node: `import OpenAI from "openai";
const client = new OpenAI({
  baseURL: "${base}",
  apiKey: "${authVal}", // ${token ? "your dashboard token" : "replace $TOKEN"} — or use X-Api-Key: sk-...
});
const res = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Hello" }],
});`,
    python: `from openai import OpenAI
client = OpenAI(
  base_url="${base}",
  api_key="${authVal}",  # ${token ? "dashboard token" : "replace $TOKEN"} — or X-Api-Key: sk-...
)
res = client.chat.completions.create(
  model="auto",
  messages=[{"role": "user", "content": "Hello"}],
)
print(res.choices[0].message.content)`,
    php: `<?php
use GuzzleHttp\\Client;

$client = new Client();
$response = $client->post("${base}/chat/completions", [
  "headers" => [
    "Authorization" => "Bearer ${authVal}",
    "Content-Type" => "application/json",
  ],
  "json" => [
    "model" => "auto",
    "messages" => [["role" => "user", "content" => "Hello"]],
  ],
]);
echo $response->getBody();`,
    go: `package main

import (
  "bytes"
  "fmt"
  "net/http"
)

func main() {
  body := []byte(\`{"model":"auto","messages":[{"role":"user","content":"Hello"}]}\`)
  req, _ := http.NewRequest("POST", "${base}/chat/completions", bytes.NewBuffer(body))
  req.Header.Set("Authorization", "Bearer ${authVal}")
  req.Header.Set("Content-Type", "application/json")
  res, _ := http.DefaultClient.Do(req)
  defer res.Body.Close()
  fmt.Println(res.Status)
}`,
  };

  const tabs = [
    { id: "curl", label: t("customer.integration.curlTitle") },
    { id: "node", label: t("customer.integration.nodeTitle") },
    { id: "python", label: t("customer.integration.pythonTitle") },
    { id: "php", label: t("customer.integration.phpTitle") },
    { id: "go", label: t("customer.integration.goTitle") },
  ];

  return (
    <div style={{ display: "grid", gap: 16, color: fg }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: "Space Grotesk, sans-serif", fontSize: 20, fontWeight: 800, color: fg }}>{t("customer.integration.title")}</h2>
        <p style={{ margin: "6px 0 0", color: muted, fontSize: 13.5, lineHeight: 1.7, maxWidth: 720 }}>{t("customer.integration.subtitle")}</p>
      </div>

      <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: cardBg, overflow: "hidden", boxShadow: isLight ? "0 1px 12px rgba(0,0,0,0.04)" : "none" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 8, borderBottom: `1px solid ${border}`, background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}>
          {tabs.map((tb) => {
            const isActive = active === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setActive(tb.id)}
                style={{
                  fontFamily: "DM Mono, monospace", fontSize: 12, padding: "8px 12px", borderRadius: 9,
                  border: isActive ? `1px solid ${accent}` : `1px solid transparent`,
                  background: isActive ? (isLight ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.18)") : inactiveTab,
                  color: isActive ? accent : muted, cursor: "pointer", fontWeight: isActive ? 700 : 500,
                }}
              >{tb.label}</button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 12px", borderBottom: `1px solid ${border}` }}>
          <button
            onClick={() => copy(snippet[active])}
            style={{ fontFamily: "DM Mono, monospace", fontSize: 11, padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(255,255,255,0.06)", color: fg, cursor: "pointer" }}
          >{t("customer.common.copy")}</button>
        </div>
        <pre style={{ margin: 0, padding: 16, background: codeBg, color: isLight ? "#1c1917" : "#e0e7ff", fontFamily: "DM Mono, monospace", fontSize: 12.5, lineHeight: 1.6, overflowX: "auto", minHeight: 180 }}>{snippet[active]}</pre>
      </div>

       {!token && (
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)", color: isLight ? "#92400e" : "#fde68a", fontFamily: "DM Mono, monospace", fontSize: 12 }}>
          No API key / token found — sign in, then copy your token from the dashboard or create a key in API Keys. Snippets above use $TOKEN placeholder until you log in.
        </div>
       )}
      <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: isLight ? "#fff" : "rgba(16,185,129,0.06)", padding: 14, fontFamily: "DM Mono, monospace", fontSize: 12, lineHeight: 1.7, color: muted, boxShadow: isLight ? "0 1px 10px rgba(0,0,0,0.04)" : "none" }}>
        <span style={{ color: "#10b981" }}>✓</span> {t("customer.integration.note")}
      </div>
    </div>
  );
}
