import { Router, Request, Response } from "express";
import Customer from "../models/Customer";

const router = Router();

// GET /api/customers - Get all customers
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const filter: any = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// POST /api/customers - Create new customer
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, address, notes, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return res.status(409).json({ error: "Customer with this email already exists" });
    }

    const customer = new Customer({
      name,
      email,
      phone,
      company,
      address,
      notes,
      status: status || "active",
    });
    await customer.save();

    res.status(201).json({ message: "Customer created successfully", customer });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// PUT /api/customers/:id - Update customer
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, address, notes, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Check if email is taken by another customer
    const existingCustomer = await Customer.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.params.id },
    });
    if (existingCustomer) {
      return res.status(409).json({ error: "Email already in use by another customer" });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, company, address, notes, status },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer updated successfully", customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

export default router;
