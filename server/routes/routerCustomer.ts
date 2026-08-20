import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import RouterCustomer from "../models/RouterCustomer";
import CreditCustomer from "../models/CreditCustomer";
import CreditLog from "../models/CreditLog";
import RouterModel from "../models/RouterModel";
import { resolveCustomerIdFromApiKey } from "./customerApiKey";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// VPS 9router — canonical upstream for chat proxy
// Primary: RouterModel.base_url as stored in DB (VPS 9router URL per model)
// Fallback: server env ROUTER_CUSTOMER_URL / NINE_ROUTER_URL (VPS 9router)
// No hard-coded silent default — if both empty, caller gets 503 with setup hint
function stripQuotes(s: string): string {
  let t = String(s || "").trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) t = t.slice(1, -1).trim();
  return t;
}
function getEffectiveRouterBaseUrl(rm?: any): string {
  const raw = stripQuotes(String(rm?.base_url || ""));
  if (raw) return raw.replace(/\/+$/, "");
  const env = stripQuotes(
    String(
      process.env.ROUTER_CUSTOMER_URL ||
        process.env.NINE_ROUTER_URL ||
        process.env.VPS_9ROUTER_URL ||
        process.env.ROUTER_UPSTREAM_URL ||
        process.env.ROUTER_BASE_URL ||
        "",
    ),
  );
  if (env) return env.replace(/\/+$/, "");
  return "";
}

function parseUpstreamJson(raw: string): any | null {
  if (!raw) return null;
  let s = String(raw).trim();
  // strip trailing SSE terminator even when glued: `}data: [DONE]`
  s = s.replace(/\s*data:\s*\[DONE\]\s*$/i, "").trim();
  // SSE `data: {...}` lines — take last parseable JSON
  if (s.includes("data:")) {
    const chunks = s
      .split(/data:/)
      .map((x) => x.trim())
      .filter(Boolean);
    for (let i = chunks.length - 1; i >= 0; i--) {
      const c = chunks[i].replace(/^\s*\[DONE\]\s*$/i, "").trim();
      if (!c || c === "[DONE]") continue;
      const a = c.indexOf("{");
      const b = c.lastIndexOf("}");
      const cand = a !== -1 && b !== -1 && b > a ? c.slice(a, b + 1) : c;
      try {
        return JSON.parse(cand);
      } catch {}
      try {
        return JSON.parse(c);
      } catch {}
    }
  }
  try {
    return JSON.parse(s);
  } catch {}
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a !== -1 && b !== -1 && b > a) {
    try {
      return JSON.parse(s.slice(a, b + 1));
    } catch {}
  }
  return null;
}

function getCustomerIdFromAuth(req: Request): string | null {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return null;
  if (token.startsWith("sk-")) return null;
  try {
    const d = jwt.verify(token, JWT_SECRET) as {
      customerId?: string;
      userId?: string;
    };
    return d.customerId || d.userId || null;
  } catch {
    return null;
  }
}

function extractApiKey(req: Request): string | null {
  const h = String(req.headers["x-api-key"] || "").trim();
  if (h && h.startsWith("sk-")) return h;
  const auth = String(req.headers.authorization || "").trim();
  if (auth.startsWith("Bearer sk-")) return auth.slice(7).trim();
  return null;
}

async function resolveCustomerId(req: Request): Promise<string | null> {
  const fromJwt = getCustomerIdFromAuth(req);
  if (fromJwt) return fromJwt;
  const raw = extractApiKey(req);
  if (!raw) return null;
  return resolveCustomerIdFromApiKey(raw);
}

// ── AUTH: must be before /:id so "auth" isn't captured as an id ──
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, ref_code } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ error: "Name, email and password are required" });
    if (String(password).length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    const emailLc = String(email).toLowerCase().trim();
    const exists = await RouterCustomer.findOne({ email: emailLc });
    if (exists)
      return res.status(409).json({ error: "Email already registered" });

    // Optional referral code — must belong to an existing customer
    let referredBy = "";
    const rawRef = String(ref_code || "").trim().toUpperCase();
    if (rawRef) {
      const referrer = await RouterCustomer.findOne({ ref_code: rawRef }).select("_id ref_code");
      if (!referrer)
        return res.status(400).json({ error: "Invalid referral code" });
      referredBy = referrer.ref_code;
    }

    const doc = new RouterCustomer({
      name: String(name).trim(),
      email: emailLc,
      password,
      status: "active",
      referred_by: referredBy,
    });
    doc.ref_code = await (RouterCustomer as any).assignRefCode(doc);
    await doc.save();
    await CreditCustomer.findOneAndUpdate(
      { customer_id: doc._id },
      { balance: 0 },
      { upsert: true, new: true },
    );
    const token = jwt.sign(
      { customerId: String(doc._id), email: doc.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    const user = {
      id: doc._id,
      name: doc.name,
      email: doc.email,
      status: doc.status,
      ref_code: doc.ref_code,
    };
    res.status(201).json({
      message: "Registration successful",
      token,
      user,
      router_customer: user,
    });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000)
      return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    const doc = await RouterCustomer.findOne({
      email: String(email).toLowerCase().trim(),
    });
    if (!doc) return res.status(401).json({ error: "Invalid credentials" });
    if (doc.status !== "active")
      return res.status(403).json({ error: "Account is inactive" });
    const ok = await doc.comparePassword(String(password));
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      { customerId: String(doc._id), email: doc.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    const user = {
      id: doc._id,
      name: doc.name,
      email: doc.email,
      status: doc.status,
      ref_code: doc.ref_code,
    };
    res.json({
      message: "Login successful",
      token,
      user,
      router_customer: user,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/auth/me", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    const decoded = jwt.verify(token, JWT_SECRET) as { customerId: string };
    const doc = await RouterCustomer.findById(decoded.customerId).select(
      "-password",
    );
    if (!doc) return res.status(404).json({ error: "Customer not found" });
    res.json({
      user: {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        status: doc.status,
        ref_code: doc.ref_code,
      },
    });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// GET /api/router-customers?status=&search=&page=&limit=
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, search, page, limit } = req.query as any;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (search)
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const [rows, total] = await Promise.all([
      RouterCustomer.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      RouterCustomer.countDocuments(filter),
    ]);
    res.json({
      router_customers: rows,
      total,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch router customers" });
  }
});

// GET /api/router-customers/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await RouterCustomer.findById(req.params.id).select(
      "-password",
    );
    if (!row)
      return res.status(404).json({ error: "Router customer not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch router customer" });
  }
});

// POST /api/router-customers
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, password, status } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email, password required" });
    const exists = await RouterCustomer.findOne({
      email: String(email).toLowerCase(),
    });
    if (exists) return res.status(409).json({ error: "Email already exists" });
    const doc = new RouterCustomer({
      name,
      email,
      password,
      status: status || "active",
    });
    doc.ref_code = await (RouterCustomer as any).assignRefCode(doc);
    await doc.save();
    await CreditCustomer.create({ customer_id: doc._id, balance: 0 });
    const out: any = doc.toObject();
    delete out.password;
    res.status(201).json({ message: "Created", router_customer: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create router customer" });
  }
});

// PUT /api/router-customers/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, email, password, status } = req.body;
    if (!name || !email)
      return res.status(400).json({ error: "name and email required" });
    const dup = await RouterCustomer.findOne({
      email: String(email).toLowerCase(),
      _id: { $ne: req.params.id },
    });
    if (dup) return res.status(409).json({ error: "Email in use" });
    const doc = await RouterCustomer.findById(req.params.id);
    if (!doc)
      return res.status(404).json({ error: "Router customer not found" });
    doc.name = name;
    doc.email = email;
    if (status) doc.status = status;
    if (password) doc.password = password;
    await doc.save();
    const out: any = doc.toObject();
    delete out.password;
    res.json({ message: "Updated", router_customer: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update router customer" });
  }
});

// ── CHAT: POST /api/router-customers/chat/completions — proxy to router model base_url, deduct balance, log ──
// ── OpenAI-compatible shims for @ai-sdk/openai-compatible & other clients ──
// Must be before /:id so "models"/"v1" aren't captured as an id.
// baseURL = https://.../api/router-customers → SDK calls GET /models and POST /chat/completions (or /v1/*)
function toOpenAIModels(rows: any[]) {
  return {
    object: "list" as const,
    data: rows.map((r: any) => ({
      id: String(r.model_id || r.name),
      object: "model" as const,
      created: Math.floor(new Date(r.createdAt || Date.now()).getTime() / 1000),
      owned_by: String(r.provider || "alvine"),
    })),
  };
}
async function handleListModels(_req: Request, res: Response) {
  try {
    const rows = await RouterModel.find({ status: "active" }).sort({ createdAt: 1 });
    res.json(toOpenAIModels(rows as any[]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch models" });
  }
}
router.get("/models", handleListModels);
router.get("/v1/models", handleListModels);

router.get("/chat/models", async (_req: Request, res: Response) => {
  try {
    const rows = await RouterModel.find({ status: "active" })
      .select(
        "name provider model_id base_url context_window credits_per_1k status",
      )
      .sort({ createdAt: 1 });
    res.json({ models: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

async function handleChatCompletions(req: Request, res: Response) {
  try {
    const customerId = await resolveCustomerId(req);
    if (!customerId)
      return res
        .status(401)
        .json({
          error:
            "Unauthorized — missing or invalid token or API key. Use Authorization: Bearer <JWT> or X-Api-Key: sk-... / Authorization: Bearer sk-...",
        });
    const customer = await RouterCustomer.findById(customerId);
    if (!customer) return res.status(401).json({ error: "Customer not found" });
    if (customer.status !== "active")
      return res.status(403).json({ error: "Account is inactive" });

    const { messages, model, stream } = req.body as {
      messages?: { role: string; content: string }[];
      model?: string;
      stream?: boolean;
    };
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "messages[] is required" });

    // resolve router model: model param can be model_id or "auto"; fallback to first active
    let rm: any = null;
    const want = String(model || "auto").trim();
    if (want && want !== "auto") {
      rm = await RouterModel.findOne({
        model_id: want,
        status: "active",
      }).select("+api_key");
      if (!rm)
        rm = await RouterModel.findOne({ name: want, status: "active" }).select(
          "+api_key",
        );
    }
    if (!rm)
      rm = await RouterModel.findOne({ status: "active" })
        .select("+api_key")
        .sort({ createdAt: 1 });
    if (!rm)
      return res.status(503).json({
        error:
          "No active router model configured — add one in Admin → Router Models (base URL + API key)",
      });
    let baseUrl = getEffectiveRouterBaseUrl(rm);
    if (!baseUrl)
      return res.status(503).json({
        error: `Router model "${rm.name}" has no base URL and no VPS fallback configured — set base_url in Admin → Router Models or set ROUTER_CUSTOMER_URL on server`,
      });
    const apiKey = stripQuotes(String((rm as any).api_key || ""));
    const resolvedKey =
      apiKey ||
      stripQuotes(
        String(
          process.env.ROUTER_API_KEY || process.env.OPENAI_API_KEY || "",
        ),
      );
    if (!resolvedKey) {
      return res.status(503).json({
        error: `Upstream API key not configured — Router model "${rm.name}" has no api_key. Set it in Admin → Router Models (or set ROUTER_API_KEY env). Remote returned: API key required for remote API access.`,
      });
    }

    const cc = await CreditCustomer.findOne({ customer_id: customer._id });
    if (!cc)
      return res
        .status(402)
        .json({ error: "No credit account — contact support", balance: 0 });
    if (cc.balance < 1)
      return res
        .status(402)
        .json({ error: "Insufficient credits", balance: cc.balance });

    // ── STREAMING ──
    // pipe upstream SSE chunks straight to the client; deduct credits after the
    // stream completes using the final usage from the stream (or a minimum).
    if (stream) {
      const buildCandidates = (b: string): string[] => {
        const raw = b.replace(/\/+$/, "");
        if (raw.endsWith("/chat/completions")) return [raw];
        const primary = `${raw}/chat/completions`;
        const hasVersion = /\/v\d+(\/|$)/.test(raw);
        if (!hasVersion) return [primary, `${raw}/v1/chat/completions`];
        return [primary];
      };
      const candidates = buildCandidates(baseUrl);
      const upstreamBody: any = { model: rm.model_id, messages, stream: true };
      for (const k of [
        "temperature",
        "top_p",
        "max_tokens",
        "max_completion_tokens",
        "presence_penalty",
        "frequency_penalty",
        "stop",
        "n",
      ] as const) {
        if ((req.body as any)[k] !== undefined)
          upstreamBody[k] = (req.body as any)[k];
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (resolvedKey) headers["Authorization"] = `Bearer ${resolvedKey}`;

      let upstream: any = null;
      let tried: string[] = [];
      for (const url of candidates) {
        tried.push(url);
        try {
          const r = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(upstreamBody),
          });
          upstream = r;
          if (r.ok) break;
          // non-2xx — read body for the error message
          const t = await r.text();
          let d: any = null;
          try {
            d = t ? JSON.parse(t) : null;
          } catch {
            d = { _raw: t };
          }
          const raw =
            (d && (d.error?.message || d.error || d.message)) ||
            t ||
            `Upstream ${r.status}`;
          if (/^\s*<!DOCTYPE|^\s*<html/i.test(String(raw))) {
            return res.status(502).json({
              error: `Upstream returned HTML ${r.status} — base_url is likely wrong. Model "${rm.name}" base_url is "${baseUrl}". Expected an OpenAI-compatible API at one of: ${tried.join(", ")}. Fix in Admin → Router Models (e.g. https://api.openai.com/v1 or https://router.alvineitsolutions.com/v1).`,
              upstream_status: r.status,
              tried,
              base_url: baseUrl,
            });
          }
          const msg = String(raw).slice(0, 1200);
          const code =
            r.status === 429 ? 429 : r.status >= 500 ? 502 : r.status;
          return res
            .status(code)
            .json({ error: msg, upstream_status: r.status, tried });
        } catch (e: any) {
          if (url !== candidates[candidates.length - 1]) continue;
          return res.status(502).json({
            error: `Upstream unreachable — tried ${tried.join(", ")} — ${String(e?.message || "fetch failed").slice(0, 400)}`,
            upstream_status: 502,
            tried,
          });
        }
      }

      if (!upstream || !upstream.body)
        return res
          .status(502)
          .json({
            error: "Upstream returned no stream body",
            upstream_status: 502,
            tried,
          });

      res.status(200);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      // accumulate usage + a plain-text content mirror (for billing fallback)
      let usage: any = null;
      let contentLen = 0;
      let buffered = "";
      let lastChunk = Buffer.alloc(0);
      let ended = false;

      const reader = (upstream.body as any).getReader();
      const decoder = new TextDecoder();

      const finish = async (aborted: boolean) => {
        if (ended) return;
        ended = true;
        try {
          const promptTokens =
            Number(usage?.prompt_tokens ?? usage?.input_tokens ?? 0) || 0;
          const completionTokens =
            Number(usage?.completion_tokens ?? usage?.output_tokens ?? 0) || 0;
          const cachedTokens =
            Number(
              usage?.prompt_tokens_details?.cached_tokens ??
                usage?.cached_tokens ??
                0,
            ) || 0;
          const totalTokens =
            promptTokens + completionTokens ||
            Number(usage?.total_tokens ?? 0) ||
            0;
          // if stream had no usage (non-OpenAI upstream), estimate from bytes
          const estimatedTokens =
            totalTokens > 0
              ? totalTokens
              : Math.max(1, Math.ceil(contentLen / 4));
          const rate =
            Number((rm as any).credits_per_1k) > 0
              ? Number((rm as any).credits_per_1k)
              : 1;
          const tokensForBilling = estimatedTokens > 0 ? estimatedTokens : 1000;
          const creditOut = Math.max(
            1,
            Math.ceil(tokensForBilling / 1000) * rate,
          );

          // only deduct if not aborted mid-stream (client disconnect) — avoid charging for partial streams
          if (!aborted) {
            if (cc.balance < creditOut) {
              // not enough for the final bill — charge what remains, keep log honest
              const charged = Math.max(0, cc.balance);
              cc.balance = 0;
              await cc.save();
              if (charged > 0) {
                await CreditLog.create({
                  credit_customer_id: cc._id,
                  credit_out: charged,
                  input_token: promptTokens,
                  cached_token: cachedTokens,
                  output_token: completionTokens,
                  model_name: rm.name || rm.model_id || "",
                });
              }
            } else {
              cc.balance -= creditOut;
              await cc.save();
              await CreditLog.create({
                credit_customer_id: cc._id,
                credit_out: creditOut,
                input_token: promptTokens,
                cached_token: cachedTokens,
                output_token: completionTokens,
                model_name: rm.name || rm.model_id || "",
              });
            }
            // _credits via SSE breaks strict OpenAI validators (opencode / @ai-sdk/openai-compatible)
            // only emit when client opts in via header; opencode gets pure OpenAI chunks
            const wantCredits = String(req.headers["x-alvine-credits"] || req.headers["x-include-credits"] || "").trim() === "1";
            if (wantCredits) {
              try {
                res.write(
                  `data: ${JSON.stringify({ _credits: { credit_out: creditOut, balance: cc.balance, model: rm.model_id } })}\n\n`,
                );
              } catch {}
            }
          }
        } catch (e: any) {
          console.error("chat stream billing error:", e?.message || e);
        } finally {
          try {
            res.end();
          } catch {}
        }
      };

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = Buffer.from(value);
          contentLen += chunk.length;
          lastChunk = chunk;
          buffered += decoder.decode(value, { stream: true });
          // scan accumulated buffer for usage: { ... } — covers usage split across chunks
          const usageMatch = buffered.match(/"usage"\s*:\s*\{[^}]*\}/);
          if (usageMatch) {
            try {
              usage = JSON.parse(`{${usageMatch[0]}}`).usage ?? usage;
            } catch {}
          }
          try {
            res.write(chunk);
          } catch {}
        }
        await finish(false);
      } catch (e: any) {
        console.error("chat stream read error:", e?.message || e);
        await finish(true);
      }
      return;
    }

    // build candidate upstream URLs — handles base_url with or without /v1 and with or without /chat/completions
    const buildCandidates = (b: string): string[] => {
      const raw = b.replace(/\/+$/, "");
      if (raw.endsWith("/chat/completions")) return [raw];
      const primary = `${raw}/chat/completions`;
      const hasVersion = /\/v\d+(\/|$)/.test(raw);
      if (!hasVersion) return [primary, `${raw}/v1/chat/completions`];
      return [primary];
    };
    const candidates = buildCandidates(baseUrl);
    const upstreamBody: any = { model: rm.model_id, messages };
    for (const k of [
      "temperature",
      "top_p",
      "max_tokens",
      "max_completion_tokens",
      "presence_penalty",
      "frequency_penalty",
      "stop",
      "n",
    ] as const) {
      if ((req.body as any)[k] !== undefined)
        upstreamBody[k] = (req.body as any)[k];
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (resolvedKey) headers["Authorization"] = `Bearer ${resolvedKey}`;

    let upstream: any = null;
    let text = "";
    let data: any = null;
    let lastStatus = 0;
    let tried: string[] = [];
    for (const url of candidates) {
      tried.push(url);
      try {
        const r = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(upstreamBody),
        });
        const t = await r.text();
        const d = parseUpstreamJson(t);
        const isHtml = /^\s*<!DOCTYPE|^\s*<html/i.test(t);
        // treat SSE-trailing raw as parseable: if parses to chat completion, consider ok even if raw had suffix
        const isParsedCompletion = !!(
          d &&
          typeof d === "object" &&
          (d as any).choices
        );
        if (r.ok) {
          upstream = r;
          text = t;
          data = d ?? { _raw: t };
          break;
        }
        if (isParsedCompletion) {
          upstream = r;
          text = t;
          data = d;
          break;
        }
        if (
          r.status === 404 &&
          isHtml &&
          url !== candidates[candidates.length - 1]
        ) {
          lastStatus = r.status;
          text = t;
          data = d ?? { _raw: t };
          continue;
        }
        upstream = r;
        text = t;
        data = d ?? { _raw: t };
        break;
      } catch (e: any) {
        lastStatus = 0;
        text = e?.message || "fetch failed";
        data = { error: text };
        // network error → try next candidate
        if (url !== candidates[candidates.length - 1]) continue;
        upstream = null;
        break;
      }
    }
    if (!upstream) {
      console.error(
        `chat upstream fetch failed — tried ${tried.join(" , ")} — last: ${text.slice(0, 300)}`,
      );
      return res.status(502).json({
        error: `Upstream unreachable — tried ${tried.join(", ")} — ${String(text).slice(0, 400)}`,
        upstream_status: 502,
        tried,
      });
    }
    if (!upstream.ok) {
      const raw =
        (data && (data.error?.message || data.error || data.message)) ||
        text ||
        `Upstream ${upstream.status}`;
      const isHtml = /^\s*<!DOCTYPE|^\s*<html/i.test(String(raw));
      if (isHtml) {
        const hint = `Upstream returned HTML ${upstream.status} — base_url is likely wrong. Model "${rm.name}" base_url is "${baseUrl}". Expected an OpenAI-compatible API at one of: ${tried.join(", ")}. Fix in Admin → Router Models (e.g. https://api.openai.com/v1 or https://router.alvineitsolutions.com/v1).`;
        console.error(
          `chat upstream HTML ${upstream.status} — tried ${tried.join(", ")} — base_url=${baseUrl}`,
        );
        return res.status(502).json({
          error: hint,
          upstream_status: upstream.status,
          tried,
          base_url: baseUrl,
        });
      }
      const msg = String(raw).slice(0, 1200);
      const code =
        upstream.status === 429
          ? 429
          : upstream.status >= 500
            ? 502
            : upstream.status;
      return res
        .status(code)
        .json({ error: msg, upstream_status: upstream.status, tried });
    }

    // usage → credits: per-1k tokens using model's rate
    const usage = (data && data.usage) || {};
    const promptTokens =
      Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0;
    const completionTokens =
      Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0;
    const cachedTokens =
      Number(
        usage.prompt_tokens_details?.cached_tokens ?? usage.cached_tokens ?? 0,
      ) || 0;
    const totalTokens =
      promptTokens + completionTokens || Number(usage.total_tokens ?? 0) || 0;
    const rate =
      Number((rm as any).credits_per_1k) > 0
        ? Number((rm as any).credits_per_1k)
        : 1;
    // bill at least 1 credit even if usage missing; round up per 1k
    const tokensForBilling = totalTokens > 0 ? totalTokens : 1000;
    const creditOut = Math.max(1, Math.ceil(tokensForBilling / 1000) * rate);

    if (cc.balance < creditOut)
      return res.status(402).json({
        error: "Insufficient credits for this request",
        balance: cc.balance,
        required: creditOut,
      });

    cc.balance -= creditOut;
    await cc.save();
    await CreditLog.create({
      credit_customer_id: cc._id,
      credit_out: creditOut,
      input_token: promptTokens,
      cached_token: cachedTokens,
      output_token: completionTokens,
      model_name: rm.name || rm.model_id || "",
    });

    // normalize upstream into clean OpenAI chat.completion shape — strip _raw/SSE artifacts
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      (data as any)._raw &&
      (data as any).choices
    ) {
      delete (data as any)._raw;
    }
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      (data as any)._raw
    ) {
      const parsed = parseUpstreamJson(String((data as any)._raw));
      if (parsed && typeof parsed === "object" && (parsed as any).choices) {
        data = parsed;
      } else {
        // upstream returned non-JSON — surface readable error instead of leaking _raw to client
        return res
          .status(502)
          .json({
            error: String((data as any)._raw).slice(0, 800),
            upstream_status: 502,
          });
      }
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res
        .status(502)
        .json({
          error: "Upstream returned invalid JSON",
          upstream_status: 502,
        });
    }
    // _credits breaks strict OpenAI response validators (opencode) — only attach when opted in
    const wantCredits = String(req.headers["x-alvine-credits"] || req.headers["x-include-credits"] || "").trim() === "1";
    if (wantCredits) {
      (data as any)._credits = {
        credit_out: creditOut,
        balance: cc.balance,
        model: rm.model_id,
      };
    }
    res.json(data);
  } catch (e: any) {
    console.error("chat/completions error:", e?.message || e);
    res.status(500).json({ error: e?.message || "Chat proxy failed" });
  }
}
router.post("/chat/completions", handleChatCompletions);
router.post("/v1/chat/completions", handleChatCompletions);
// Also accept SDK's default: POST / (baseURL already points to /api/router-customers)
// no — SDK appends /chat/completions; the v1 shim above covers it

// DELETE /api/router-customers/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await RouterCustomer.findByIdAndDelete(req.params.id);
    if (!doc)
      return res.status(404).json({ error: "Router customer not found" });
    const cc = await CreditCustomer.findOne({ customer_id: doc._id });
    if (cc) {
      await CreditLog.deleteMany({ credit_customer_id: cc._id });
      await CreditCustomer.deleteOne({ _id: cc._id });
    }
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete router customer" });
  }
});

export default router;
