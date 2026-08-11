import { Router, Request, Response } from "express";
import Timeline from "../models/Timeline";
import Customer from "../models/Customer";

const router = Router();

// GET /api/customers/:customerId/timeline - Get timeline for a customer
router.get("/:customerId/timeline", async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const filter: any = { customerId: req.params.customerId };

    if (type && type !== "all") {
      filter.type = type;
    }

    const timeline = await Timeline.find(filter).sort({ createdAt: -1 });
    res.json(timeline);
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

// POST /api/customers/:customerId/timeline - Add timeline entry
router.post("/:customerId/timeline", async (req: Request, res: Response) => {
  try {
    const { type, title, description, startDate, endDate, metadata } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: "Type and title are required" });
    }

    // Verify customer exists
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const timeline = new Timeline({
      customerId: req.params.customerId,
      type,
      title,
      description,
      startDate,
      endDate,
      metadata,
    });
    await timeline.save();

    res.status(201).json({ message: "Timeline entry added", timeline });
  } catch (error) {
    console.error("Error adding timeline entry:", error);
    res.status(500).json({ error: "Failed to add timeline entry" });
  }
});

// PUT /api/customers/:customerId/timeline/:id - Update timeline entry
router.put("/:customerId/timeline/:id", async (req: Request, res: Response) => {
  try {
    const { type, title, description, startDate, endDate, metadata } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: "Type and title are required" });
    }

    const timeline = await Timeline.findOneAndUpdate(
      { _id: req.params.id, customerId: req.params.customerId },
      { type, title, description, startDate, endDate, metadata },
      { new: true, runValidators: true }
    );

    if (!timeline) {
      return res.status(404).json({ error: "Timeline entry not found" });
    }

    res.json({ message: "Timeline entry updated", timeline });
  } catch (error) {
    console.error("Error updating timeline entry:", error);
    res.status(500).json({ error: "Failed to update timeline entry" });
  }
});

// DELETE /api/customers/:customerId/timeline/:id - Delete timeline entry
router.delete("/:customerId/timeline/:id", async (req: Request, res: Response) => {
  try {
    const timeline = await Timeline.findOneAndDelete({
      _id: req.params.id,
      customerId: req.params.customerId,
    });

    if (!timeline) {
      return res.status(404).json({ error: "Timeline entry not found" });
    }

    res.json({ message: "Timeline entry deleted" });
  } catch (error) {
    console.error("Error deleting timeline entry:", error);
    res.status(500).json({ error: "Failed to delete timeline entry" });
  }
});

export default router;
