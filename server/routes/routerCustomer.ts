import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import RouterCustomer from "../models/RouterCustomer";
import CreditCustomer from "../models/CreditCustomer";
import CreditLog from "../models/CreditLog";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// ── AUTH: must be before /:id so "auth" isn't captured as an id ──
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required" });
    if (String(password).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const emailLc = String(email).toLowerCase().trim();
    const exists = await RouterCustomer.findOne({ email: emailLc });
    if (exists) return res.status(409).json({ error: "Email already registered" });
    const doc = new RouterCustomer({ name: String(name).trim(), email: emailLc, password, status: "active" });
    await doc.save();
    await CreditCustomer.findOneAndUpdate({ customer_id: doc._id }, { balance: 0 }, { upsert: true, new: true });
    const token = jwt.sign({ customerId: String(doc._id), email: doc.email }, JWT_SECRET, { expiresIn: "7d" });
    const user = { id: doc._id, name: doc.name, email: doc.email, status: doc.status };
    res.status(201).json({ message: "Registration successful", token, user, router_customer: user });
  } catch (e: any) {
    console.error(e);
    if (e.code === 11000) return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const doc = await RouterCustomer.findOne({ email: String(email).toLowerCase().trim() });
    if (!doc) return res.status(401).json({ error: "Invalid credentials" });
    if (doc.status !== "active") return res.status(403).json({ error: "Account is inactive" });
    const ok = await doc.comparePassword(String(password));
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ customerId: String(doc._id), email: doc.email }, JWT_SECRET, { expiresIn: "7d" });
    const user = { id: doc._id, name: doc.name, email: doc.email, status: doc.status };
    res.json({ message: "Login successful", token, user, router_customer: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/auth/me", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    const decoded = jwt.verify(token, JWT_SECRET) as { customerId: string };
    const doc = await RouterCustomer.findById(decoded.customerId).select("-password");
    if (!doc) return res.status(404).json({ error: "Customer not found" });
    res.json({ user: { id: doc._id, name: doc.name, email: doc.email, status: doc.status } });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// GET /api/router-customers?status=&search=&page=&limit=
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, search, page, limit } = req.query as any;
    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const [rows, total] = await Promise.all([
      RouterCustomer.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      RouterCustomer.countDocuments(filter),
    ]);
    res.json({ router_customers: rows, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch router customers" });
  }
});

// GET /api/router-customers/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const row = await RouterCustomer.findById(req.params.id).select("-password");
    if (!row) return res.status(404).json({ error: "Router customer not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch router customer" });
  }
});

// POST /api/router-customers
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, password, status } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
    const exists = await RouterCustomer.findOne({ email: String(email).toLowerCase() });
    if (exists) return res.status(409).json({ error: "Email already exists" });
    const doc = new RouterCustomer({ name, email, password, status: status || "active" });
    await doc.save();
    await CreditCustomer.create({ customer_id: doc._id, balance: 0 });
    const out: any = doc.toObject();
    delete out.password;
    res.status(201).json({ message: "Created", router_customer: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create router customer" });
  }
});

// PUT /api/router-customers/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, email, password, status } = req.body;
    if (!name || !email) return res.status(400).json({ error: "name and email required" });
    const dup = await RouterCustomer.findOne({ email: String(email).toLowerCase(), _id: { $ne: req.params.id } });
    if (dup) return res.status(409).json({ error: "Email in use" });
    const doc = await RouterCustomer.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Router customer not found" });
    doc.name = name;
    doc.email = email;
    if (status) doc.status = status;
    if (password) doc.password = password;
    await doc.save();
    const out: any = doc.toObject();
    delete out.password;
    res.json({ message: "Updated", router_customer: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update router customer" });
  }
});

// DELETE /api/router-customers/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const doc = await RouterCustomer.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Router customer not found" });
    const cc = await CreditCustomer.findOne({ customer_id: doc._id });
    if (cc) {
      await CreditLog.deleteMany({ credit_customer_id: cc._id });
      await CreditCustomer.deleteOne({ _id: cc._id });
    }
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete router customer" });
  }
});

export default router;
