import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Файл в корне проекта с датой последнего уведомления (YYYY-MM-DD). */
const LAST_NOTIFY_FILE = path.join(process.cwd(), "last_notify_date.txt");

/** Безопасный ответ: никогда не роняем страницу/робота 5xx. */
function muted(extra?: Record<string, unknown>) {
  return NextResponse.json(
    { success: false, error: "muted", ...extra },
    { status: 200 }
  );
}

function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readLastNotifyDateFromFile(): string | null {
  try {
    if (!fs.existsSync(LAST_NOTIFY_FILE)) return null;
    const raw = fs.readFileSync(LAST_NOTIFY_FILE, "utf8");
    const value = raw.trim();
    if (!value) return null;
    return value.slice(0, 10);
  } catch {
    return null;
  }
}

function writeLastNotifyDateToFile(date: string): void {
  try {
    fs.writeFileSync(LAST_NOTIFY_FILE, `${date}\n`, "utf8");
  } catch (e) {
    console.error("Failed to write last_notify_date.txt:", e);
  }
}

/** Роботы иногда дергают GET — отвечаем 200, без побочных эффектов. */
export async function GET() {
  try {
    return NextResponse.json({ success: true, ok: true }, { status: 200 });
  } catch {
    return muted();
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: { rate?: unknown } = {};
    try {
      body = (await request.json()) as { rate?: unknown };
    } catch {
      return muted({ reason: "bad_json" });
    }

    const rate = body.rate;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      return muted({ reason: "bad_rate" });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token?.trim() || !chatId?.trim()) {
      return muted({ reason: "no_telegram_env" });
    }

    const today = getTodayIso();
    const lastDate = readLastNotifyDateFromFile();
    if (lastDate && lastDate.trim() === today) {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 });
    }

    const text = `📈 КУРС ОБНОВЛЕН: 1 EUR = ${rate} RUB.`;
    const url = "https://telegram-proxy-bridge.onrender.com/api/bridge";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("Telegram API error (rate-notify):", res.status, err);
      return muted({ reason: "telegram_failed" });
    }

    writeLastNotifyDateToFile(today);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("Rate-notify API error:", e);
    return muted();
  }
}
