import { Router, Request, Response } from "express";
import CreditCustomer from "../models/CreditCustomer";
import CreditLog from "../models/CreditLog";

const router = Router();

// GET /api/credit-logs?credit_customer_id=&limit=&page=
router.get("/", async (req: Request, res: Response) => {
  try {
    const { credit_customer_id, limit = "50", page = "1" } = req.query as any;
    const filter: any = {};
    if (credit_customer_id) filter.credit_customer_id = credit_customer_id;
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const rows = await CreditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((pg - 1) * lim)
      .limit(lim);
    const total = await CreditLog.countDocuments(filter);
    res.json({ logs: rows, total, page: pg, limit: lim });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch credit logs" });
  }
});

// GET /api/credit-logs/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await CreditLog.findById(req.params.id);
    if (!row) return res.status(404).json({ error: "Credit log not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// POST /api/credit-logs — deducts credit_customer.balance atomically
router.post("/", async (req: Request, res: Response) => {
  try {
    const { credit_customer_id, credit_out, input_token = 0, cached_token = 0, output_token = 0 } = req.body;
    if (!credit_customer_id) return res.status(400).json({ error: "credit_customer_id required" });
    const co = Number(credit_out);
    if (!Number.isFinite(co) || co < 0) return res.status(400).json({ error: "credit_out must be >= 0" });
    const it = Number(input_token) || 0;
    const ct = Number(cached_token) || 0;
    const ot = Number(output_token) || 0;
    for (const [k, v] of [["input_token", it], ["cached_token", ct], ["output_token", ot]] as const) {
      if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: `${k} must be >= 0` });
    }

    const cc = await CreditCustomer.findById(credit_customer_id);
    if (!cc) return res.status(404).json({ error: "Credit customer not found" });
    if (cc.balance < co) return res.status(400).json({ error: "Insufficient balance" });

    cc.balance -= co;
    await cc.save();

    const log = await CreditLog.create({ credit_customer_id, credit_out: co, input_token: it, cached_token: ct, output_token: ot });
    res.status(201).json({ message: "Logged", credit_log: log, balance: cc.balance });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create credit log" });
  }
});

// PUT /api/credit-logs/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { credit_out, input_token, cached_token, output_token } = req.body;
    const patch: any = {};
    for (const [k, v] of Object.entries({ credit_out, input_token, cached_token, output_token })) {
      if (v !== undefined) {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: `${k} must be >= 0` });
        patch[k] = n;
      }
    }
    const row = await CreditLog.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ error: "Credit log not found" });
    res.json({ message: "Updated", credit_log: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update" });
  }
});

// DELETE /api/credit-logs/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const row = await CreditLog.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ error: "Credit log not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
