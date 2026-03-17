import { NextRequest, NextResponse } from "next/server";

type Body = {
  orgName: string;
  contactName: string;
  phone: string;
  email: string;
};

function buildMessage(body: Body): string {
  const lines = [
    "📝 ЗАЯВКА НА РЕГИСТРАЦИЮ",
    "",
    `🏢 Наименование организации: ${body.orgName}`,
    `👤 Имя: ${body.contactName}`,
    `📞 Телефон: ${body.phone}`,
    `✉️ Email: ${body.email}`,
  ];
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Body>;

    if (
      !body.orgName?.trim() ||
      !body.contactName?.trim() ||
      !body.phone?.trim() ||
      !body.email?.trim()
    ) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
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

    const text = buildMessage({
      orgName: body.orgName.trim(),
      contactName: body.contactName.trim(),
      phone: body.phone.trim(),
      email: body.email.trim(),
    });

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram API error (register-request):", res.status, err);
      return NextResponse.json(
        { error: "Не удалось отправить заявку в Telegram" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (e) {
    console.error("Register-request API error:", e);
    return NextResponse.json(
      { error: "Ошибка отправки заявки" },
      { status: 500 }
    );
  }
}

