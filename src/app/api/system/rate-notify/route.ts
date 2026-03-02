import { NextRequest, NextResponse } from "next/server";

/** Дата (YYYY-MM-DD UTC), когда последний раз отправили уведомление о курсе. */
let lastRateNotifyDate: string | null = null;

function getTodayUtc(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
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

    const today = getTodayUtc();
    if (lastRateNotifyDate === today) {
      return new NextResponse(null, { status: 200 });
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

    lastRateNotifyDate = today;
    return new NextResponse(null, { status: 200 });
  } catch (e) {
    console.error("Rate-notify API error:", e);
    return NextResponse.json(
      { error: "Ошибка обработки запроса" },
      { status: 500 }
    );
  }
}
