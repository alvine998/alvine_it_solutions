# Security Assessment — AI Router Project

Security review of the AI router (React/Vite frontend in `src/`, Express + Mongoose backend in `server/`).
The app routes/forwards requests to AI providers (OpenAI, Anthropic, etc.), manages API keys, credits/usage, orders, and has an admin panel.

**Review date:** 2026-08-19

---

## Severity summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High     | 5 |
| Medium   | 6 |
| Low      | 4 |

---

## Critical

### C1. No authentication/authorization on most endpoints

There is no auth middleware anywhere (`server/` has no `middleware/` directory). Only four route groups check tokens inline:
- `server/routes/order.ts` — `GET /me`, `POST /`, `POST /:id/pay`, `POST /:id/cancel` (via local `auth()` helper, order.ts:44-49)
- `server/routes/routerCustomer.ts` — `chat/completions` (via `getCustomerIdFromAuth`, line 162), `auth/me` (line 63)
- `server/routes/auth.ts` — `GET /me` (line 91)

**Everything else** — router model CRUD (including provider API keys), credit balance set/adjust, credit logs, orders listing, customer/plan/invoice/payment-method/timeline CRUD — requires **zero authentication**.

Attack examples (single unauthenticated request):
- `POST /api/credit-customers` with `{customer_id: <victim>, balance: 999999}` → free credits
- `POST /api/credit-customers/:id/adjust` with `{delta: 100000}` → free credits
- `POST /api/router-models` with an attacker-controlled `base_url` → harvest the shared provider key
- `GET /api/credit-customers` → enumerate every user's balance
- `GET /api/orders`, `GET /api/router-customers` → full data enumeration
- Register an account and call `/chat/completions` to burn the company's provider quota

Affected files: `server/routes/routerModel.ts`, `routerCustomer.ts` (CRUD), `creditCustomer.ts`, `creditLog.ts`, `customerPlan.ts`, `plan.ts`, `order.ts` (GET), `paymentMethod.ts`, `customer.ts`, `invoice.ts`, `contact.ts`, `timeline.ts`, `server/index.ts:29-41`.

**Fix:** Add `requireAuth` middleware plus a `requireAdmin` middleware that verifies `decoded.role === "admin"`, and apply them per-router. Never allow unauthenticated mutation of balances or keys.

---

### C2. Provider API keys readable by anyone (plaintext at rest + returned via unauthenticated endpoint)

- `server/models/RouterModel.ts:22` — `api_key` stored as plaintext string (only `select: false` at the query layer)
- `server/routes/routerModel.ts:79` — `PUT /:id` does `.select("+api_key")` and returns the full doc; the `delete out.api_key` at line 91 happens after the doc was already serialized
- Since router-model routes have no auth (C1), **anyone can read any provider API key (OpenAI, Anthropic, …) with one HTTP call**
- The chat proxy also interpolates the raw API key into an upstream error hint (`server/routes/routerCustomer.ts:241`)

**Fix:** Encrypt keys at rest (AES-256-GCM with a server-side master key from env), never return the key in any response, require admin auth on all model routes. Consider KMS/secret manager.

---

### C3. Free credits via mock self-service payment

`server/routes/order.ts:93-126` — `POST /api/orders/:id/pay` lets the authenticated customer flip their own pending order to "paid" and provisions credits:

```ts
// In production: replace with gateway webhook. For now flip to paid + provision.
order.status = "paid";
...
await CreditCustomer.findOneAndUpdate(
  { customer_id: order.customer_id },
  { $inc: { balance: order.credits } },
  { upsert: true, new: true }
);
```

The frontend literally labels the button "Pay (mock) →" (`src/pages/customer/Orders.tsx`). Anyone can POST `/api/orders` then `/api/orders/:id/pay` to mint credits with zero payment, then drain the provider quota through the chat proxy.

**Fix:** Remove the self-service pay endpoint (or gate it behind a real payment gateway webhook + admin confirmation). All balance mutations must be admin-only, server-side, atomic, and audited.

---

### C4. Weak/guessable JWT secret → token forgery

- `server/routes/auth.ts:6` — `const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";`
- `server/routes/routerCustomer.ts:9` and `server/routes/order.ts:8` — same fallback
- `server/.env.example` does **not** define `JWT_SECRET`
- Tokens carry `role` (auth.ts:28) but no middleware ever checks it (see C1)

If `JWT_SECRET` env is unset, anyone can forge a valid 7-day token for any `customerId` (and use the proxy for free), or an admin token once role checks exist. `jsonwebtoken@9` rejects `alg: "none"` by default, so alg-confusion is mitigated — the secret is the binding constraint.

**Fix:** Use one cryptographically random secret (e.g. `openssl rand -base64 48`), **no hardcoded fallback** — fail fast if `JWT_SECRET` is unset. Restrict `algorithms: ["HS256"]` explicitly in `jwt.verify` and add `issuer`/`audience` claims.

---

## High

### H1. No rate limiting anywhere

`server/index.ts:25-26` — only `cors()` + `express.json()`. No `express-rate-limit` or equivalent anywhere:
- Unauthenticated brute-force of `/api/auth/login` and `/api/router-customers/auth/login`
- Open registration (`POST /api/router-customers/auth/register`) mints unlimited accounts, each able to hammer `/chat/completions` and drain the company's provider quota
- `POST /api/credit-customers/:id/adjust` can be looped to ratchet any balance up

**Fix:** Rate-limit auth endpoints (5–10/min/IP), signup, the proxy endpoint (per-customer tokens/min), and credit mutations.

### H2. Non-atomic credit deduction → race conditions

- `server/routes/routerCustomer.ts:263-264` — `cc.balance -= creditOut; await cc.save();`
- `server/routes/creditLog.ts:48-49` — same read-modify-write pattern

Two concurrent requests can both read `balance = 1`, both pass the `cc.balance < creditOut` check, and both deduct → negative balances / free usage. The schema `min: 0` validator only runs at `save()` on the last writer — not a concurrency guard.

**Fix:** Use atomic updates with a guard:
```ts
const res = await CreditCustomer.updateOne(
  { _id: cc._id, balance: { $gte: creditOut } },
  { $inc: { balance: -creditOut } }
);
if (res.modifiedCount !== 1) return res.status(402).json({ error: "Insufficient credits" });
```
Same pattern for `adjust` (guard `balance: { $gte: -delta }`).

### H3. Chat proxy is an SSRF + arbitrary-model/billing-bypass surface

`server/routes/routerCustomer.ts:160-283`:
- `base_url` is admin-set, but the admin gate is missing (C1) — anyone can `POST /api/router-models` with `base_url: "http://169.254.169.254/..."` or an internal host, then drive `fetch` to any URL with the provider key attached (`Authorization: Bearer` header, line 200) — full SSRF
- Model selection is by user-supplied `model` (line 174) with fallback to any active model — no plan/permission mapping, so a free/basic user can pick the most powerful/cheapest model
- Billing is derived from the upstream's **self-reported** `usage` (lines 213-221); if missing, a flat 1000 tokens is billed (≥1 credit per request). Combined with C1, an attacker doesn't even need this since they can zero their own balance directly
- Upstream error messages are forwarded (up to 800–1200 chars, lines 209/245), which can leak internal URLs/keys

**Fix:** (1) Fix C1 first. (2) Hard-allowlist upstream base URLs in server config; never take them from the DB without admin. (3) Enforce plan/model entitlement server-side. (4) Cap messages, body size, and per-request upstream timeout. (5) Bill from server-side token accounting with a hard floor, deducted atomically.

### H4. No request size limits / unbounded body

`server/index.ts:26` — `express.json()` with default 100kb limit, no lower bound for chat. `routerCustomer.ts:169` only checks `messages` is a non-empty array — no cap on length, per-message size, or total tokens. An attacker can POST a `messages` array with thousands of huge entries — resource-exhaustion and cost-drain vector (worse with no rate limiting, H1).

**Fix:** `express.json({ limit: "1mb" })`, enforce `messages.length <= N` and per-message character caps, cap `max_tokens` forwarded upstream.

### H5. MongoDB operator injection / NoSQL injection in filters

Query params flow straight into Mongoose filters without validation:
- `server/routes/creditLog.ts:10` — `credit_customer_id` from query → `filter.credit_customer_id`
- `server/routes/order.ts:43` — `customer_id` from query → `filter.customer_id`
- `server/routes/creditCustomer.ts:10-12`, `customerPlan.ts:10` — same pattern
- `search` params become `$regex` on user input (`routerModel.ts:14-17`, `routerCustomer.ts:80`, `plan.ts`, `paymentMethod.ts`) — operator injection and ReDoS risk

Mongoose interprets `customer_id[$ne]=x` or `[$gt]` as operators, letting an unauthenticated caller bypass objectid filtering or run expensive regex queries.

**Fix:** Validate/coerce every query value to a plain string (reject objects), cast IDs via `new Types.ObjectId` in try/catch, escape regex metacharacters in search terms.

---

## Medium

### M1. Mass assignment: self-register as admin

`server/routes/auth.ts:52,63`:
```ts
const { name, email, password, role } = req.body;
const user = new User({ name, email, password, role: role || "user" });
```
Any unauthenticated caller can `POST /api/auth/register` with `{ role: "admin" }` and receive an admin-role JWT. No route checks role today (C1), but this is a standing privilege-escalation path the moment role checks are added.

**Fix:** Never accept `role` from the client; default to `"user"`; set admin only server-side (seed or admin bootstrap flag).

### M2. Mass assignment on invoice/plan/order/contact creation

`server/routes/invoice.ts:24-26` — `new Invoice(invoiceData)` with the whole `req.body`; `PUT /:id` (line 60) uses `req.body` directly in `findByIdAndUpdate`. Similar in `plan.ts:48-63`, `routerModel.ts`, `paymentMethod.ts`. The invoice generator page is publicly reachable (`/generate/invoice`, `src/main.tsx:64`) using `createInvoice` (`src/lib/api.ts:24`) with no token.

**Fix:** Explicitly whitelist fields per route (`pick(body, [...])`), compute derived values (totals, status) server-side, require auth for invoice creation or rate-limit it.

### M3. Tokens in localStorage (XSS → full account/admin takeover)

`src/pages/AdminLogin.tsx:29-30`, `src/pages/Auth.tsx:103-105` store the 7-day JWT in `localStorage`, sent via `Authorization: Bearer`. Any XSS yields token theft. Admin and customer share the **same** `token` localStorage key — a customer token and an admin token overwrite each other. `Chat.tsx`/`Usage.tsx` even render a "Copy token" button exposing the raw JWT in the UI.

**Fix:** Use httpOnly, Secure, SameSite cookies for the JWT; keep admin and customer sessions separate; remove the "Copy token" UI.

### M4. Admin panel has no client-side or server-side role protection

`src/App.tsx` / `src/main.tsx:56-74` expose all `/admin/*` routes; `src/pages/AdminDashboard.tsx:27-32` only redirects to login if localStorage is empty (no role check); `src/components/AdminLayout.tsx` has no guard at all. The server never rejects the calls anyway (C1).

**Fix:** Server-side admin enforcement (C1/M1) plus a client-side role gate.

### M5. Default/weak seeded admin credentials

`server/seed.ts:62-77` — if the seed runs against production, `admin@gmail.com` / `admin1234` becomes a live admin account with a known password.

**Fix:** Require `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars for seeding; refuse obvious defaults; force password change on first login.

### M6. Global wildcard CORS + no security headers

- `server/index.ts:25` — `app.use(cors())` reflects any origin; combined with tokens in localStorage, any website's scripts can call the API
- No `helmet` anywhere (`server/package.json`); `nginx/proxy.conf` sets no security headers
- No CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, or `Permissions-Policy`

**Fix:** CORS with an explicit origin allowlist; add helmet (or equivalent headers in nginx).

---

## Low

### L1. Error handling leaks internal details

`server/routes/routerCustomer.ts:281` returns raw `e.message`; `creditCustomer.ts:58-60`, `routerModel.ts:68-71` surface `e.message` variants; the chat proxy forwards upstream error text and `base_url`. Mongo errors in degraded mode (`server/index.ts:62-64`) reach clients.

**Fix:** Log full errors server-side; return generic messages to clients; sanitize upstream errors.

### L2. Plaintext MongoDB connection string default

`server/index.ts:20` — `process.env.MONGODB_URI || "mongodb://localhost:27017/alvine_it_solution"` reinforces that env is optional. `.env` files are gitignored (only `.env.example` with placeholders is tracked) — but ensure real credentials never end up in the repo or in any committed file.

**Fix:** Remove localhost default fallback in production; document secrets handling.

### L3. `PaymentMethod.image` is an unbounded base64 data-URL

`server/models/PaymentMethod.ts:21` — unbounded strings stored and served with no size/type/scheme validation; potential stored-XSS vector if rendered as `img src` without scheme checks, plus DB bloat.

**Fix:** Validate size, type, and scheme; store as uploaded file/object URL instead of base64.

### L4. Open registration with no email verification or invites

`server/routes/routerCustomer.ts:22-41` — immediate JWT, zero balance, `status: "active"`. Combined with no rate limit (H1), unlimited account farming to abuse the proxy.

**Fix:** Gate signup (invite/captcha/email verification); require a real plan purchase before chat access is usable.

---

## Things done well

- **Passwords are bcrypt-hashed** (`User.ts:24-34`, `RouterCustomer.ts:24-33`, bcryptjs, salt rounds 10, re-hash only on modification)
- **`api_key` is `select: false` at schema level** and CRUD responses attempt `delete out.api_key` — the intent is right (defeated by C1/C2)
- **Server-side billing baseline**: per-1k model rate, minimum 1-credit charge, pre-flight balance check (`routerCustomer.ts:218-223`)
- **Pagination is bounded everywhere** (limits clamped to 100–200), preventing trivial list-size DoS

---

## Remediation order

1. Rotate any exposed secrets; set a strong random `JWT_SECRET` via env (no fallback) — C4
2. Add `requireAuth` + `requireAdmin` middleware; wire into every router; stop accepting `role` from clients — C1, M1, M4
3. Remove/gate `POST /api/orders/:id/pay` and unauthenticated credit-adjust routes behind real payment + admin — C3
4. Make all balance mutations atomic (`$inc` with `$gte` guard) — H2
5. Allowlist upstream base URLs; add rate limits, body limits, timeouts; encrypt provider keys at rest and never return them — C2, H1, H3, H4
6. Move tokens to httpOnly cookies; add helmet + CORS allowlist; validate inputs and whitelist fields — M2, M3, M6, H5
