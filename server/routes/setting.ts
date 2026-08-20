import { Router, Request, Response } from "express";
import Setting from "../models/Setting";
import { requireAdmin } from "../middleware/auth";

const router = Router();

async function getSettings() {
  let doc = await Setting.findOne();
  if (!doc) doc = await Setting.create({});
  return doc;
}

// GET /api/settings — public (used by customer payment view to show Telegram link)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const doc = await getSettings();
    res.json({ telegram_username: doc.telegram_username });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to load settings" }); }
});

// PUT /api/settings — admin updates settings
router.put("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { telegram_username } = req.body ?? {};
    const doc = await getSettings();
    if (typeof telegram_username === "string") {
      doc.telegram_username = telegram_username.replace(/^@/, "").trim();
    }
    await doc.save();
    res.json({ message: "Settings updated", telegram_username: doc.telegram_username });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to update settings" }); }
});

export default router;
