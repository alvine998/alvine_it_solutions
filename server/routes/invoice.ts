import { Router, Request, Response } from "express";
import Invoice from "../models/Invoice";

const router = Router();

// POST /api/invoices - Create new invoice
router.post("/", async (req: Request, res: Response) => {
  try {
    const invoiceData = req.body;

    if (!invoiceData.number || !invoiceData.billTo || !invoiceData.items?.length) {
      return res.status(400).json({ error: "Invoice number, billTo, and items are required" });
    }

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    res.status(201).json({ message: "Invoice created successfully", invoice });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Invoice number already exists" });
    }
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// GET /api/invoices - Get all invoices
router.get("/", async (_req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// GET /api/invoices/:id - Get invoice by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// PUT /api/invoices/:id - Update invoice
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ message: "Invoice updated successfully", invoice });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Invoice number already exists" });
    }
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;