import { NextRequest, NextResponse } from "next/server";

type Body = {
  name?: string;
  phone?: string;
  message: string;
  website?: string; // honeypot
};

function buildMessage(body: Body): string {
  const name = body.name?.trim() || "не указано";
  const phone = body.phone?.trim() || "не указан";
  return [
    "💬 НОВОЕ СООБЩЕНИЕ ИЗ ЧАТА",
    `👤 Имя: ${name}`,
    `📞 Телефон: ${phone}`,
    `📝 Вопрос: ${body.message}`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;

    if (body.website?.trim()) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "Введите сообщение" },
        { status: 400 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID ?? process.env.CHAT_ID;

    if (!token?.trim() || !chatId?.trim()) {
      return NextResponse.json(
        { error: "Настройте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.local" },
        { status: 500 }
      );
    }

    const text = buildMessage({
      name: body.name.trim(),
      phone: body.phone.trim(),
      message: body.message.trim(),
    });

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
