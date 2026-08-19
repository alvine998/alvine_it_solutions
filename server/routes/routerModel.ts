import { Router, Request, Response } from "express";
import RouterModel from "../models/RouterModel";

const router = Router();

// GET /api/router-models?status=&search=&page=&limit=
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, search, page, limit } = req.query as any;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { provider: { $regex: search, $options: "i" } },
        { model_id: { $regex: search, $options: "i" } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const [rows, total] = await Promise.all([
      RouterModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      RouterModel.countDocuments(filter),
    ]);
    res.json({ router_models: rows, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch router models" });
  }
});

// GET /api/router-models/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await RouterModel.findById(req.params.id);
    if (!row) return res.status(404).json({ error: "Router model not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch router model" });
  }
});

// POST /api/router-models
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, provider, model_id, base_url, context_window, status } = req.body;
    if (!name || !provider || !model_id) {
      return res.status(400).json({ error: "name, provider and model_id are required" });
    }
    const doc = new RouterModel({
      name: String(name).trim(),
      provider: String(provider).trim(),
      model_id: String(model_id).trim(),
      base_url: String(base_url || "").trim(),
      context_window: Number(context_window) || 0,
      status: status || "active",
    });
    await doc.save();
    res.status(201).json({ message: "Created", router_model: doc });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000) return res.status(409).json({ error: "Model name already exists" });
    res.status(500).json({ error: "Failed to create router model" });
  }
});

// PUT /api/router-models/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, provider, model_id, base_url, context_window, status } = req.body;
    const doc = await RouterModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Router model not found" });
    if (name) doc.name = String(name).trim();
    if (provider) doc.provider = String(provider).trim();
    if (model_id) doc.model_id = String(model_id).trim();
    if (base_url !== undefined) doc.base_url = String(base_url || "").trim();
    if (context_window !== undefined) doc.context_window = Number(context_window) || 0;
    if (status) doc.status = status;
    await doc.save();
    res.json({ message: "Updated", router_model: doc });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000) return res.status(409).json({ error: "Model name already exists" });
    res.status(500).json({ error: "Failed to update router model" });
  }
});

// DELETE /api/router-models/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await RouterModel.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Router model not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete router model" });
  }
});

export default router;
