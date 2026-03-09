import { NextRequest, NextResponse } from "next/server";

function buildMessage(name: string, phone: string, message: string): string {
  const n = (name || "").trim() || "Не указано";
  const p = (phone || "").trim() || "Не указано";
  return [
    "💬 НОВОЕ СООБЩЕНИЕ ИЗ ЧАТА",
    `👤 Имя: ${n}`,
    `📞 Телефон: ${p}`,
    `📝 Вопрос: ${message}`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const body = raw && typeof raw === "object" ? raw : {};
    const name = typeof body.name === "string" ? body.name : "";
    const phone = typeof body.phone === "string" ? body.phone : "";
    const message = typeof body.message === "string" ? body.message : "";
    const website = typeof body.website === "string" ? body.website : "";

    if ((website || "").trim()) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!(message || "").trim()) {
      return NextResponse.json(
        { error: "Введите сообщение" },
        { status: 400 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID ?? process.env.CHAT_ID;

    if (!(token || "").trim() || !(chatId || "").trim()) {
      return NextResponse.json(
        { error: "Настройте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.local" },
        { status: 500 }
      );
    }

    const text = buildMessage(name, phone, message.trim());

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram API error:", res.status, err);
      return NextResponse.json(
        { error: "Не удалось отправить сообщение в Telegram" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("Contact-message API error:", e);
    return NextResponse.json(
      { error: "Ошибка отправки сообщения" },
      { status: 500 }
    );
  }
}
