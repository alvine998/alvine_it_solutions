import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Setting from "../models/Setting";
import { requireAdmin } from "../middleware/auth";
import { sendTelegramMessage, getTelegramConfigDebug } from "../lib/telegram";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const router = Router();

async function getSettings() {
  let doc = await Setting.findOne();
  if (!doc) doc = await Setting.create({});
  return doc;
}

function isAdminReq(req: Request): boolean {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return false;
  try {
    const d = jwt.verify(token, JWT_SECRET) as any;
    return d?.role === "admin";
  } catch { return false; }
}

function maskToken(t: string) {
  if (!t) return "";
  if (t.length <= 8) return "••••••••";
  return t.slice(0, 4) + "••••" + t.slice(-4);
}

// GET /api/settings — public (customer view needs telegram_username; admin view also needs chat_id/token status)
router.get("/", async (req: Request, res: Response) => {
  try {
    const doc: any = await getSettings();
    const isAdmin = isAdminReq(req);
    const botToken: string = doc.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || "";
    const chatId: string = doc.telegram_chat_id || process.env.TELEGRAM_CHAT_ID || "";
    res.json({
      telegram_username: doc.telegram_username,
      telegram_chat_id: isAdmin ? chatId : undefined,
      has_telegram_bot: Boolean(botToken),
      telegram_bot_token_masked: isAdmin && botToken ? maskToken(botToken) : undefined,
      // only admin gets raw token so the UI can keep it filled; never expose to public
      telegram_bot_token: isAdmin ? botToken : undefined,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to load settings" }); }
});

// PUT /api/settings — admin updates settings
router.put("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { telegram_username, telegram_bot_token, telegram_chat_id } = req.body ?? {};
    const doc: any = await getSettings();
    if (typeof telegram_username === "string") {
      doc.telegram_username = telegram_username.replace(/^@/, "").trim();
    }
    if (typeof telegram_bot_token === "string") {
      // allow clearing by sending empty string; ignore placeholder masks
      if (telegram_bot_token.includes("•")) {
        // masked value sent back — don't overwrite
      } else {
        doc.telegram_bot_token = telegram_bot_token.trim();
      }
    }
    if (typeof telegram_chat_id === "string") {
      doc.telegram_chat_id = telegram_chat_id.trim();
    }
    await doc.save();
    res.json({
      message: "Settings updated",
      telegram_username: doc.telegram_username,
      telegram_chat_id: doc.telegram_chat_id,
      has_telegram_bot: Boolean(doc.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN),
      telegram_bot_token_masked: doc.telegram_bot_token ? maskToken(doc.telegram_bot_token) : undefined,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: "Failed to update settings" }); }
});

// GET /api/settings/telegram/debug — admin diagnostics: shows which chat_id will receive alerts
router.get("/telegram/debug", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const cfg: any = await getTelegramConfigDebug();
    const botId = String(cfg.token || "").split(":")[0] || "";
    res.json({
      chat_id: cfg.chatId || null,
      token_present: Boolean(cfg.token),
      bot_id: botId || null,
      chat_is_bot_itself: Boolean(cfg.chatId && botId && String(cfg.chatId).trim() === botId),
      hint: cfg.chatId && botId && String(cfg.chatId).trim() === botId
        ? "chat_id equals bot id — bot cannot message itself. Set chat_id to your user/group id from getUpdates."
        : undefined,
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/settings/telegram/test — admin sends a test message to verify bot wiring
router.post("/telegram/test", requireAdmin, async (_req: Request, res: Response) => {
  try {
    await sendTelegramMessage("✅ Telegram webhook is configured. New payment submissions will notify this chat.", { parseMode: "HTML" });
    res.json({ message: "Test message sent to Telegram" });
  } catch (e: any) {
    console.error("[telegram] test failed:", e);
    res.status(400).json({ error: e.message || "Failed to send test message. Check bot token and chat ID." });
  }
});

export default router;
