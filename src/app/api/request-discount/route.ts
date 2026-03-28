import { NextRequest, NextResponse } from "next/server";

type Body = {
  customerName: string;
  customerPhone: string;
  productName: string;
  productId?: string;
};

function buildMessage(body: Body): string {
  const lines = [
    "💰 ЗАПРОС СКИДКИ",
    "",
    `👤 Имя: ${body.customerName}`,
    `📞 Телефон: ${body.customerPhone}`,
    "",
    `🛒 Товар: ${body.productName}`,
    ...(body.productId ? [`   ID: ${body.productId}`] : []),
  ];
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;

    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Укажите имя и телефон" },
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
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      productName: body.productName?.trim() || "—",
      productId: body.productId,
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
        { error: "Не удалось отправить заявку в Telegram" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("Request-discount API error:", e);
    return NextResponse.json(
      { error: "Ошибка отправки заявки" },
      { status: 500 }
    );
  }
}
