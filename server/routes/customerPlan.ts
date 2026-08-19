import { Router, Request, Response } from "express";
import CustomerPlan from "../models/CustomerPlan";
import RouterCustomer from "../models/RouterCustomer";

const router = Router();

// GET /api/customer-plans?customer_id=&search=&page=&limit=
router.get("/", async (req: Request, res: Response) => {
  try {
    const { customer_id, search, page, limit } = req.query as any;
    const filter: any = {};
    if (customer_id) filter.customer_id = customer_id;
    if (search) {
      const customers = await RouterCustomer.find({ name: { $regex: search, $options: "i" } }).select("_id");
      filter.customer_id = { $in: customers.map((c) => c._id) };
    }
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const [rows, total] = await Promise.all([
      CustomerPlan.find(filter)
        .populate("customer_id", "name email")
        .populate("plan_id", "name price")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      CustomerPlan.countDocuments(filter),
    ]);
    res.json({ customer_plans: rows, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch customer plans" });
  }
});

// GET /api/customer-plans/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await CustomerPlan.findById(req.params.id).populate("customer_id", "name email").populate("plan_id", "name price");
    if (!row) return res.status(404).json({ error: "Customer plan not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch customer plan" });
  }
});

// POST /api/customer-plans
router.post("/", async (req: Request, res: Response) => {
  try {
    const { customer_id, plan_id, start_date, due_date } = req.body;
    if (!customer_id || !plan_id || !start_date || !due_date) {
      return res.status(400).json({ error: "customer_id, plan_id, start_date and due_date are required" });
    }
    const doc = new CustomerPlan({ customer_id, plan_id, start_date, due_date });
    await doc.save();
    const out = await (doc as any).populate("customer_id", "name email").populate("plan_id", "name price");
    res.status(201).json({ message: "Created", customer_plan: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create customer plan" });
  }
});

// PUT /api/customer-plans/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { customer_id, plan_id, start_date, due_date } = req.body;
    const doc = await CustomerPlan.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Customer plan not found" });
    if (customer_id) doc.customer_id = customer_id;
    if (plan_id) doc.plan_id = plan_id;
    if (start_date) doc.start_date = start_date;
    if (due_date) doc.due_date = due_date;
    await doc.save();
    const out = await (doc as any).populate("customer_id", "name email").populate("plan_id", "name price");
    res.json({ message: "Updated", customer_plan: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update customer plan" });
  }
});

// DELETE /api/customer-plans/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await CustomerPlan.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Customer plan not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete customer plan" });
  }
});

export default router;
