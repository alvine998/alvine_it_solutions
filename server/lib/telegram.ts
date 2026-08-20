import Setting from "../models/Setting";

function getConfigFromEnv() {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || "").trim();
  return { token, chatId };
}

async function getTelegramConfig(): Promise<{ token: string; chatId: string }> {
  const env = getConfigFromEnv();
  if (env.token && env.chatId) return env;
  try {
    const doc: any = await Setting.findOne().lean();
    const token = doc?.telegram_bot_token?.trim() || env.token;
    const chatId = doc?.telegram_chat_id?.trim() || env.chatId;
    return { token, chatId };
  } catch {
    return env;
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function botIdFromToken(token: string): string {
  return token.split(":")[0]?.trim() || "";
}

function friendlyTelegramError(raw: string, chatId: string, token: string): string {
  const botId = botIdFromToken(token);
  if (/can't send messages to the bot/i.test(raw)) {
    return `chat_id ${chatId} is the bot itself (bot id ${botId}). Bot can't message itself — set TELEGRAM_CHAT_ID to your user/group chat ID, not the bot's ID. Send a message to the bot and call https://api.telegram.org/bot<token>/getUpdates to find your chat_id.`;
  }
  if (/chat not found/i.test(raw)) return `chat not found for ${chatId}. Add bot to that group/channel or start a DM with the bot first, then retry.`;
  if (/bot was blocked/i.test(raw)) return `bot was blocked by user ${chatId}. Unblock and start the bot again.`;
  if (/Unauthorized|Not Found/i.test(raw)) return `invalid bot token (401). Recheck TELEGRAM_BOT_TOKEN from @BotFather.`;
  return raw;
}

export async function sendTelegramMessage(text: string, opts?: { parseMode?: "HTML" | "Markdown" }) {
  const { token, chatId } = await getTelegramConfig();
  if (!token || !chatId) return { skipped: true, reason: "Telegram not configured (need bot token + chat id)" } as any;
  if (chatId === botIdFromToken(token)) throw new Error(friendlyTelegramError("Forbidden: the bot can't send messages to the bot", chatId, token));
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: opts?.parseMode || "HTML",
      disable_web_page_preview: false,
    }),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || j.ok === false) throw new Error(friendlyTelegramError(j.description || `Telegram ${res.status}`, chatId, token));
  return j;
}

export async function sendTelegramPhoto(photoUrl: string, caption: string) {
  const { token, chatId } = await getTelegramConfig();
  if (!token || !chatId) return { skipped: true, reason: "Telegram not configured" } as any;
  if (chatId === botIdFromToken(token)) throw new Error(friendlyTelegramError("Forbidden: the bot can't send messages to the bot", chatId, token));
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: "HTML" }),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || j.ok === false) throw new Error(friendlyTelegramError(j.description || `Telegram ${res.status}`, chatId, token));
  return j;
}

export function getTelegramConfigDebug() {
  // exposed for diagnostics only; call via admin route
  return getTelegramConfig();
}

// Fire-and-forget helper for order submission — never throws to caller
export async function notifyPaymentSubmitted(input: {
  orderId: string;
  amount: number;
  credits: number;
  paymentMethod?: string;
  paymentRef?: string;
  evidenceUrl?: string;
  planName?: string;
  customerName?: string;
  customerEmail?: string;
}) {
  const lines = [
    `💳 <b>New payment submitted</b>`,
    ``,
    `Plan: <b>${escapeHtml(input.planName || "-")}</b>`,
    `Amount: <b>Rp ${Number(input.amount).toLocaleString("id-ID")}</b>`,
    `Credits: ${input.credits}`,
    `Method: ${escapeHtml(input.paymentMethod || "manual")}`,
    input.paymentRef ? `Ref: <code>${escapeHtml(input.paymentRef)}</code>` : null,
    `Customer: ${escapeHtml(input.customerName || "-")} ${input.customerEmail ? `(${escapeHtml(input.customerEmail)})` : ""}`,
    `Order: <code>${escapeHtml(input.orderId)}</code>`,
    input.evidenceUrl ? `Proof: ${escapeHtml(input.evidenceUrl)}` : null,
    ``,
    `Verify in admin: /admin/orders`,
  ].filter(Boolean) as string[];
  const caption = lines.join("\n");
  try {
    // Prefer photo so admin sees proof inline; fall back to text
    if (input.evidenceUrl && /^https?:\/\//.test(input.evidenceUrl)) {
      await sendTelegramPhoto(input.evidenceUrl, caption);
    } else {
      await sendTelegramMessage(caption, { parseMode: "HTML" });
    }
  } catch (e) {
    console.error("[telegram] notify failed:", (e as Error).message);
  }
}
