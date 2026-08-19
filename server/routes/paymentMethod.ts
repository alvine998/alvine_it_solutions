import { Router, Request, Response } from "express";
import PaymentMethod from "../models/PaymentMethod";

const router = Router();

// GET /api/payment-methods?status=&type=&search=&page=&limit=
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, type, search, page, limit } = req.query as any;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (type && type !== "all") filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { account_holder: { $regex: search, $options: "i" } },
        { account_number: { $regex: search, $options: "i" } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const [rows, total] = await Promise.all([
      PaymentMethod.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      PaymentMethod.countDocuments(filter),
    ]);
    res.json({ payment_methods: rows, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch payment methods" });
  }
});

// GET /api/payment-methods/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await PaymentMethod.findById(req.params.id);
    if (!row) return res.status(404).json({ error: "Payment method not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch payment method" });
  }
});

// POST /api/payment-methods
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, type, account_holder, account_number, image, status } = req.body;
    if (!name || !type) return res.status(400).json({ error: "name and type are required" });
    if (!["qris", "bank", "e-wallet"].includes(type)) return res.status(400).json({ error: "type must be qris, bank or e-wallet" });
    const doc = new PaymentMethod({
      name: String(name).trim(),
      type,
      account_holder: String(account_holder || "").trim(),
      account_number: String(account_number || "").trim(),
      image: String(image || ""),
      status: status || "active",
    });
    await doc.save();
    res.status(201).json({ message: "Created", payment_method: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create payment method" });
  }
});

// PUT /api/payment-methods/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, type, account_holder, account_number, image, status } = req.body;
    const doc = await PaymentMethod.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Payment method not found" });
    if (name) doc.name = String(name).trim();
    if (type) {
      if (!["qris", "bank", "e-wallet"].includes(type)) return res.status(400).json({ error: "type must be qris, bank or e-wallet" });
      doc.type = type;
    }
    if (account_holder !== undefined) doc.account_holder = String(account_holder).trim();
    if (account_number !== undefined) doc.account_number = String(account_number).trim();
    if (image !== undefined) doc.image = String(image);
    if (status) doc.status = status;
    await doc.save();
    res.json({ message: "Updated", payment_method: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update payment method" });
  }
});

// DELETE /api/payment-methods/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await PaymentMethod.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Payment method not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete payment method" });
  }
});

export default router;
