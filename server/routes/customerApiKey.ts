import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import CustomerApiKey, { generateApiKey, hashApiKey } from "../models/CustomerApiKey";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function getCustomerId(req: Request): string | null {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const d = jwt.verify(token, JWT_SECRET) as { customerId?: string; userId?: string };
    return d.customerId || d.userId || null;
  } catch {
    return null;
  }
}

function auth(req: Request, res: Response, next: () => void) {
  const id = getCustomerId(req);
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  (req as any).customerId = id;
  next();
}

// GET /api/customer-api-keys — list own keys (no hash/raw)
router.get("/", auth, async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId;
    const rows = await CustomerApiKey.find({ customer_id: customerId }).sort({ createdAt: -1 });
    res.json({ api_keys: rows.map((r: any) => ({ _id: r._id, name: r.name, prefix: r.prefix, last4: r.last4, status: r.status, last_used_at: r.last_used_at, createdAt: r.createdAt, updatedAt: r.updatedAt })) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
});

// GET /api/customer-api-keys/:id
router.get("/:id", auth, async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId;
    const row = await CustomerApiKey.findOne({ _id: req.params.id, customer_id: customerId });
    if (!row) return res.status(404).json({ error: "API key not found" });
    const o: any = row.toObject();
    res.json({ _id: o._id, name: o.name, prefix: o.prefix, last4: o.last4, status: o.status, last_used_at: o.last_used_at, createdAt: o.createdAt, updatedAt: o.updatedAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch API key" });
  }
});

// POST /api/customer-api-keys — create, returns raw key ONCE
router.post("/", auth, async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId;
    const { name } = req.body as { name?: string };
    if (!name || !String(name).trim()) return res.status(400).json({ error: "name is required" });
    if (String(name).trim().length > 80) return res.status(400).json({ error: "name must be <= 80 chars" });

    const count = await CustomerApiKey.countDocuments({ customer_id: customerId, status: "active" });
    if (count >= 10) return res.status(400).json({ error: "Limit 10 active keys per customer" });

    const raw = generateApiKey();
    const key_hash = hashApiKey(raw);
    const doc = await CustomerApiKey.create({
      customer_id: customerId,
      name: String(name).trim(),
      key_hash,
      prefix: raw.slice(0, 7),
      last4: raw.slice(-4),
      status: "active",
    });
    const o: any = doc.toObject();
    res.status(201).json({
      message: "API key created — copy it now, it will not be shown again",
      api_key: { _id: o._id, name: o.name, prefix: o.prefix, last4: o.last4, status: o.status, createdAt: o.createdAt },
      key: raw,
    });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000) return res.status(500).json({ error: "Key collision, retry" });
    res.status(500).json({ error: "Failed to create API key" });
  }
});

// PUT /api/customer-api-keys/:id — rename only
router.put("/:id", auth, async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId;
    const { name } = req.body as { name?: string };
    if (!name || !String(name).trim()) return res.status(400).json({ error: "name is required" });
    if (String(name).trim().length > 80) return res.status(400).json({ error: "name must be <= 80 chars" });
    const row = await CustomerApiKey.findOneAndUpdate(
      { _id: req.params.id, customer_id: customerId },
      { name: String(name).trim() },
      { new: true }
    );
    if (!row) return res.status(404).json({ error: "API key not found" });
    const o: any = row.toObject();
    res.json({ message: "Updated", api_key: { _id: o._id, name: o.name, prefix: o.prefix, last4: o.last4, status: o.status, last_used_at: o.last_used_at, createdAt: o.createdAt, updatedAt: o.updatedAt } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update API key" });
  }
});

// POST /api/customer-api-keys/:id/revoke
router.post("/:id/revoke", auth, async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId;
    const row = await CustomerApiKey.findOneAndUpdate({ _id: req.params.id, customer_id: customerId }, { status: "revoked" }, { new: true });
    if (!row) return res.status(404).json({ error: "API key not found" });
    const o: any = row.toObject();
    res.json({ message: "Revoked", api_key: { _id: o._id, name: o.name, prefix: o.prefix, last4: o.last4, status: o.status, last_used_at: o.last_used_at, updatedAt: o.updatedAt } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to revoke API key" });
  }
});

// DELETE /api/customer-api-keys/:id — hard delete (only if revoked or owner)
router.delete("/:id", auth, async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId;
    const row = await CustomerApiKey.findOneAndDelete({ _id: req.params.id, customer_id: customerId });
    if (!row) return res.status(404).json({ error: "API key not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete API key" });
  }
});

export default router;

// helper for chat proxy: resolve api key → customer id
export async function resolveCustomerIdFromApiKey(rawKey: string): Promise<string | null> {
  if (!rawKey || !rawKey.startsWith("sk-")) return null;
  const h = hashApiKey(rawKey.trim());
  const doc = await CustomerApiKey.findOne({ key_hash: h, status: "active" }).select("customer_id");
  if (!doc) return null;
  // touch last_used_at best-effort
  CustomerApiKey.updateOne({ _id: doc._id }, { last_used_at: new Date() }).catch(() => {});
  return String((doc as any).customer_id);
}
