import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import Order from "../models/Order";
import Plan from "../models/Plan";
import CustomerPlan from "../models/CustomerPlan";
import CreditCustomer from "../models/CreditCustomer";
import RouterCustomer from "../models/RouterCustomer";
import { requireAdmin } from "../middleware/auth";
import { uploadToR2 } from "../lib/r2";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const evidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

function getCustomerId(req: Request): string | null {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const d = jwt.verify(token, JWT_SECRET) as { customerId: string };
    return d.customerId ?? null;
  } catch { return null; }
}

function auth(req: Request, res: Response, next: () => void) {
  const id = getCustomerId(req);
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  (req as any).customerId = id;
  next();
}

// POST /api/orders/upload-evidence — upload a payment proof image to R2 (customer auth)
router.post("/upload-evidence", auth, evidenceUpload.single("image"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });
    const url = await uploadToR2(new Uint8Array(req.file.buffer), req.file.mimetype);
    res.status(201).json({ url });
  } catch (e: any) {
    console.error("Evidence upload error:", e);
    res.status(500).json({ error: e.message || "Failed to upload evidence" });
  }
});

// POST /api/orders/:id/submit — customer submits evidence; order awaits admin verification
router.post("/:id/submit", auth, async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId;
    const { evidence_url, payment_ref, payment_method } = req.body;
    if (!evidence_url) return res.status(400).json({ error: "Payment evidence is required" });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (String(order.customer_id) !== String(customerId)) return res.status(403).json({ error: "Forbidden" });
    if (order.status !== "pending") return res.status(400).json({ error: `Order is ${order.status}` });
    order.evidence_url = String(evidence_url);
    order.payment_ref = payment_ref ? String(payment_ref).trim() : order.payment_ref;
    if (payment_method) order.payment_method = String(payment_method);
    order.status = "awaiting_verification";
    order.submitted_at = new Date();
    await order.save();
    res.json({ message: "Payment submitted, awaiting verification", order });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to submit payment" }); }
});

// GET /api/orders/me — my orders (customer auth)
router.get("/me", auth, async (req: Request, res: Response) => {
  const customerId = (req as any).customerId;
  const { page = "1", limit = "20" } = req.query as any;
  const pg = Math.max(1, parseInt(page) || 1);
  const lim = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const [rows, total] = await Promise.all([
    Order.find({ customer_id: customerId }).populate("plan_id", "name price credits").sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
    Order.countDocuments({ customer_id: customerId }),
  ]);
  res.json({ orders: rows, total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) });
});

// GET /api/orders — admin list
router.get("/", async (req: Request, res: Response) => {
  try {
    const { customer_id, status, search, page = "1", limit = "20" } = req.query as any;
    const filter: any = {};
    if (customer_id) filter.customer_id = customer_id;
    if (status && status !== "all") filter.status = status;
    const pg = Math.max(1, parseInt(page) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const [rows, total] = await Promise.all([
      Order.find(filter).populate("customer_id", "name email").populate("plan_id", "name price credits").sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim),
      Order.countDocuments(filter),
    ]);
    res.json({ orders: rows, total, page: pg, limit: lim, totalPages: Math.ceil(total / lim) });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to fetch orders" }); }
});

// GET /api/orders/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await Order.findById(req.params.id).populate("customer_id", "name email").populate("plan_id", "name price credits duration_days");
    if (!row) return res.status(404).json({ error: "Order not found" });
    res.json(row);
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed" }); }
});

// POST /api/orders — create order for a plan (customer auth)
// body: { plan_id, payment_method? }
router.post("/", auth, async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId;
    const { plan_id, payment_method } = req.body;
    if (!plan_id) return res.status(400).json({ error: "plan_id required" });
    const plan = await Plan.findById(plan_id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    if (plan.status !== "active") return res.status(400).json({ error: "Plan is inactive" });

    // Unique amount: base plan price + a random 3-digit code (000–999) so each
    // order has a distinct transfer amount the admin can match against payments.
    let amount = plan.price;
    for (let i = 0; i < 10; i++) {
      const candidate = plan.price + Math.floor(Math.random() * 1000);
      const clash = await Order.findOne({ plan_id: plan._id, amount: candidate, status: "pending" });
      if (!clash) {
        amount = candidate;
        break;
      }
    }

    const doc = new Order({
      customer_id: customerId,
      plan_id: plan._id,
      amount,
      credits: plan.credits,
      status: "pending",
      payment_method: payment_method || "manual",
    });
    await doc.save();
    const out = await (doc as any).populate("plan_id", "name price credits");
    res.status(201).json({ message: "Order created", order: out });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to create order" }); }
});

// POST /api/orders/:id/pay — admin verifies payment and provisions the plan.
// Only an admin can flip an order to paid (customer submits via /:id/submit).
router.post("/:id/pay", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { payment_ref, payment_method } = req.body ?? {};
    const order = await Order.findById(req.params.id).populate("plan_id");
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status === "paid") return res.json({ message: "Already paid", order });
    if (order.status !== "awaiting_verification" && order.status !== "pending") {
      return res.status(400).json({ error: `Order is ${order.status}` });
    }

    const plan: any = order.plan_id;
    const durationDays: number = plan?.duration_days ?? 30;
    const now = new Date();
    const due = new Date(now.getTime() + durationDays * 86400000);

    order.status = "paid";
    order.payment_ref = payment_ref ? String(payment_ref).trim() : `PAY-${Date.now()}`;
    if (payment_method) order.payment_method = String(payment_method);
    order.start_date = now;
    order.due_date = due;
    await order.save();

    // provision customer_plan + credits
    await CustomerPlan.create({ customer_id: order.customer_id, plan_id: order.plan_id, start_date: now, due_date: due });
    const cc = await CreditCustomer.findOneAndUpdate(
      { customer_id: order.customer_id },
      { $inc: { balance: order.credits } },
      { upsert: true, new: true }
    );

    // referral reward: the referrer of this customer gets +100 credits on the
    // customer's FIRST paid plan, capped at 3 rewards per ref_code (= 300 total).
    // Conditional findOneAndUpdate makes the cap check atomic under concurrency.
    const buyer = await RouterCustomer.findById(order.customer_id).select("referred_by ref_rewarded");
    let referral: any = null;
    if (buyer?.referred_by && !buyer.ref_rewarded) {
      const referrer = await RouterCustomer.findOneAndUpdate(
        { ref_code: buyer.referred_by, ref_used_by: { $lt: 3 } },
        { $inc: { ref_used_by: 1 } },
        { new: true }
      );
      if (referrer) {
        const referrerCc = await CreditCustomer.findOneAndUpdate(
          { customer_id: referrer._id },
          { $inc: { balance: 100 } },
          { upsert: true, new: true }
        );
        await RouterCustomer.updateOne(
          { _id: buyer._id },
          { ref_rewarded: true }
        );
        referral = { code: referrer.ref_code, reward: 100, remaining: 3 - referrer.ref_used_by, referrer_balance: referrerCc.balance };
      } else {
        // referrer missing or cap reached — never reward twice for this buyer
        await RouterCustomer.updateOne(
          { _id: buyer._id },
          { ref_rewarded: true }
        );
      }
    }

    const out = await (order as any).populate("plan_id", "name price credits");
    res.json({ message: "Payment confirmed", order: out, credit_balance: cc.balance, referral });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to pay order" }); }
});

// POST /api/orders/:id/reject — admin rejects submitted evidence; order returns to pending
router.post("/:id/reject", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { note } = req.body ?? {};
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "awaiting_verification") {
      return res.status(400).json({ error: `Order is ${order.status}` });
    }
    order.status = "pending";
    order.evidence_url = "";
    order.submitted_at = undefined;
    if (note) order.payment_ref = String(note).trim();
    await order.save();
    res.json({ message: "Payment rejected, customer can resubmit", order });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to reject order" }); }
});

// POST /api/orders/:id/cancel — customer cancels own pending order
router.post("/:id/cancel", auth, async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (String(order.customer_id) !== String(customerId)) return res.status(403).json({ error: "Forbidden" });
    if (order.status !== "pending") return res.status(400).json({ error: `Order is ${order.status}` });
    order.status = "cancelled";
    await order.save();
    res.json({ message: "Cancelled", order });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed" }); }
});

export default router;
