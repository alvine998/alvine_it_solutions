import { Router, Request, Response } from "express";
import Plan from "../models/Plan";

const router = Router();

// GET /api/plans?status=&search=&page=&limit=
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, search, page, limit } = req.query as any;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (search) filter.name = { $regex: search, $options: "i" };
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const [rows, total] = await Promise.all([
      Plan.find(filter)
        .sort({ price: 1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      Plan.countDocuments(filter),
    ]);
    res.json({ plans: rows, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// GET /api/plans/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await Plan.findById(req.params.id);
    if (!row) return res.status(404).json({ error: "Plan not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});

// POST /api/plans
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, price, credits, duration_days, cost_per_credit, features, status } = req.body;
    if (!name || price === undefined || credits === undefined) {
      return res.status(400).json({ error: "name, price and credits are required" });
    }
    const doc = new Plan({
      name: String(name).trim(),
      price: Number(price),
      credits: Number(credits),
      duration_days: Number(duration_days) || 30,
      cost_per_credit: Number(cost_per_credit) || 0,
      features: Array.isArray(features) ? features.filter((f: any) => String(f).trim()) : [],
      status: status || "active",
    });
    await doc.save();
    res.status(201).json({ message: "Created", plan: doc });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000) return res.status(409).json({ error: "Plan name already exists" });
    res.status(500).json({ error: "Failed to create plan" });
  }
});

// PUT /api/plans/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, price, credits, duration_days, cost_per_credit, features, status } = req.body;
    const doc = await Plan.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Plan not found" });
    if (name) doc.name = String(name).trim();
    if (price !== undefined) doc.price = Number(price);
    if (credits !== undefined) doc.credits = Number(credits);
    if (duration_days !== undefined) doc.duration_days = Number(duration_days) || 30;
    if (cost_per_credit !== undefined) doc.cost_per_credit = Number(cost_per_credit) || 0;
    if (features !== undefined) doc.features = Array.isArray(features) ? features.filter((f: any) => String(f).trim()) : [];
    if (status) doc.status = status;
    await doc.save();
    res.json({ message: "Updated", plan: doc });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000) return res.status(409).json({ error: "Plan name already exists" });
    res.status(500).json({ error: "Failed to update plan" });
  }
});

// DELETE /api/plans/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await Plan.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Plan not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

export default router;
