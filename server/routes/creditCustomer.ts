import { Router, Request, Response } from "express";
import CreditCustomer from "../models/CreditCustomer";
import CreditLog from "../models/CreditLog";

const router = Router();

// GET /api/credit-customers — list (filter by customer_id)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { customer_id } = req.query as any;
    const filter: any = {};
    if (customer_id) filter.customer_id = customer_id;
    const rows = await CreditCustomer.find(filter).populate("customer_id", "name email status").sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch credit customers" });
  }
});

// GET /api/credit-customers/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await CreditCustomer.findById(req.params.id).populate("customer_id", "name email status");
    if (!row) return res.status(404).json({ error: "Credit customer not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch credit customer" });
  }
});

// GET /api/credit-customers/by-customer/:customerId — convenience
router.get("/by-customer/:customerId", async (req: Request, res: Response) => {
  try {
    const row = await CreditCustomer.findOne({ customer_id: req.params.customerId }).populate("customer_id", "name email status");
    if (!row) return res.status(404).json({ error: "Credit customer not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// POST /api/credit-customers — upsert by customer_id
router.post("/", async (req: Request, res: Response) => {
  try {
    const { customer_id, balance } = req.body;
    if (!customer_id) return res.status(400).json({ error: "customer_id required" });
    const n = Number(balance ?? 0);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: "balance must be >= 0" });
    const doc = await CreditCustomer.findOneAndUpdate(
      { customer_id },
      { balance: n },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ message: "Upserted", credit_customer: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to upsert credit customer" });
  }
});

// PUT /api/credit-customers/:id — set balance
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { balance } = req.body;
    const n = Number(balance);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: "balance must be >= 0" });
    const row = await CreditCustomer.findByIdAndUpdate(req.params.id, { balance: n }, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ error: "Credit customer not found" });
    res.json({ message: "Updated", credit_customer: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update" });
  }
});

// POST /api/credit-customers/:id/adjust — { delta } add/subtract atomically
router.post("/:id/adjust", async (req: Request, res: Response) => {
  try {
    const delta = Number(req.body.delta);
    if (!Number.isFinite(delta)) return res.status(400).json({ error: "delta required" });
    const row = await CreditCustomer.findById(req.params.id);
    if (!row) return res.status(404).json({ error: "Credit customer not found" });
    const next = row.balance + delta;
    if (next < 0) return res.status(400).json({ error: "Insufficient balance" });
    row.balance = next;
    await row.save();
    res.json({ message: "Adjusted", credit_customer: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to adjust" });
  }
});

// DELETE /api/credit-customers/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const row = await CreditCustomer.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ error: "Credit customer not found" });
    await CreditLog.deleteMany({ credit_customer_id: row._id });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
