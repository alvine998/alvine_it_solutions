import { Router, Request, Response } from "express";
import Contact from "../models/Contact";

const router = Router();

// POST /api/contact - Submit contact form
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, company, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }

    const contact = new Contact({ name, email, phone, company, message });
    await contact.save();

    res.status(201).json({ message: "Contact submitted successfully", contact });
  } catch (error) {
    console.error("Error submitting contact:", error);
    res.status(500).json({ error: "Failed to submit contact" });
  }
});

// GET /api/contact - Get all contacts (admin)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

export default router;