import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Файл в корне проекта с датой последнего уведомления (YYYY-MM-DD). */
const LAST_NOTIFY_FILE = path.join(process.cwd(), "last_notify_date.txt");

function getTodayIso(): string {
  const now = new Date();
  // Локальная дата в формате YYYY-MM-DD
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { rate?: unknown };

    const rate = body.rate;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json(
        { error: "Укажите число rate в теле запроса" },
        { status: 400 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token?.trim() || !chatId?.trim()) {
      return NextResponse.json(
        { error: "Настройте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.local" },
        { status: 500 }
      );
    }

    const today = getTodayIso();
    const lastDate = readLastNotifyDateFromFile();
    console.log("Today:", today, "LastDate:", lastDate);
    if (lastDate && lastDate.trim() === today) {
      return NextResponse.json({ skipped: true });
    }

    const text = `📈 КУРС ОБНОВЛЕН: 1 EUR = ${rate} RUB.`;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram API error (rate-notify):", res.status, err);
      return NextResponse.json(
        { error: "Не удалось отправить уведомление в Telegram" },
        { status: 502 }
      );
    }

    writeLastNotifyDateToFile(today);
    return new NextResponse(null, { status: 200 });
  } catch (e) {
    console.error("Rate-notify API error:", e);
    return NextResponse.json(
      { error: "Ошибка обработки запроса" },
      { status: 500 }
    );
  }
}
