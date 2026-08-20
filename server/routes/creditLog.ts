import { Router, Request, Response } from "express";
import CreditCustomer from "../models/CreditCustomer";
import CreditLog from "../models/CreditLog";

const router = Router();

// GET /api/credit-logs/stats?credit_customer_id= — aggregates for Usage page
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { credit_customer_id } = req.query as any;
    if (!credit_customer_id) return res.status(400).json({ error: "credit_customer_id required" });
    const match: any = { credit_customer_id: (CreditLog as any).db ? undefined : undefined };
    // validate ObjectId
    let oid: any;
    try { oid = new (await import("mongoose")).default.Types.ObjectId(String(credit_customer_id)); } catch { return res.status(400).json({ error: "Invalid credit_customer_id" }); }
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfToday);
    const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // Sunday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sumFor = async (gte: Date, lt?: Date) => {
      const f: any = { credit_customer_id: oid, createdAt: { $gte: gte } as any };
      if (lt) f.createdAt.$lt = lt;
      const [r] = await CreditLog.aggregate([
        { $match: f },
        { $group: { _id: null, credit_out: { $sum: "$credit_out" }, input_token: { $sum: "$input_token" }, cached_token: { $sum: "$cached_token" }, output_token: { $sum: "$output_token" }, count: { $sum: 1 } } },
      ]);
      return { credit_out: r?.credit_out ?? 0, input_token: r?.input_token ?? 0, cached_token: r?.cached_token ?? 0, output_token: r?.output_token ?? 0, count: r?.count ?? 0, total_tokens: (r?.input_token ?? 0) + (r?.cached_token ?? 0) + (r?.output_token ?? 0) };
    };
    const getDailySeries = async (days: number) => {
      const start = new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate() - (days - 1));
      const rows: any[] = await CreditLog.aggregate([
        { $match: { credit_customer_id: oid, createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, credit_out: { $sum: "$credit_out" }, input_token: { $sum: "$input_token" }, cached_token: { $sum: "$cached_token" }, output_token: { $sum: "$output_token" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      const map = new Map<string, any>(rows.map((r: any) => [r._id, r]));
      const out: any[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        const r = map.get(key);
        out.push({ date: key, credit_out: r?.credit_out ?? 0, input_token: r?.input_token ?? 0, cached_token: r?.cached_token ?? 0, output_token: r?.output_token ?? 0, count: r?.count ?? 0, total_tokens: (r?.input_token ?? 0) + (r?.cached_token ?? 0) + (r?.output_token ?? 0) });
      }
      return out;
    };
    const [today, yesterday, weekly, monthly, allTime, seriesWeek, seriesMonth] = await Promise.all([
      sumFor(startOfToday),
      sumFor(startOfYesterday, endOfYesterday),
      sumFor(startOfWeek),
      sumFor(startOfMonth),
      sumFor(new Date(0)),
      getDailySeries(7),
      getDailySeries(30),
    ]);
    res.json({ today, yesterday, weekly, monthly, allTime, seriesWeek, seriesMonth });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

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
