import { NextRequest, NextResponse } from "next/server";

type OrderItem = {
  id?: string;
  name: string;
  quantity: number;
  priceEur?: number;
  priceRub?: number;
};

type OrderBody = {
  items: OrderItem[];
  totalPrice: string | number;
  rate?: number;
  customerName: string;
  customerPhone: string;
};

function formatRub(num: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(num)) + " руб.";
}

function calculateTotalRub(items: OrderItem[], rate: number): number {
  return items.reduce((sum, item) => {
    if (item.priceRub != null && item.priceRub > 0) {
      return sum + item.priceRub * item.quantity;
    }
    return sum + (item.priceEur ?? 0) * rate * item.quantity;
  }, 0);
}

function buildMessage(body: OrderBody): string {
  const rate = body.rate ?? 1;
  const totalRub =
    body.rate != null
      ? calculateTotalRub(body.items, rate)
      : typeof body.totalPrice === "number"
        ? body.totalPrice
        : parseFloat(String(body.totalPrice).replace(/\s/g, "")) || 0;

  const lines = [
    "📦 НОВЫЙ ЗАКАЗ",
    "",
    `👤 Клиент: ${body.customerName}`,
    `📞 Телефон: ${body.customerPhone}`,
    "",
    "🛒 Товары:",
    ...body.items.map((item) => {
      const isRub = item.priceRub != null && item.priceRub > 0;
      const sumRub = isRub
        ? item.priceRub! * item.quantity
        : (item.priceEur ?? 0) * rate * item.quantity;
      return `  • ${item.name} — ${item.quantity} шт. — ${formatRub(sumRub)}`;
    }),
    "",
    `💰 Итого: ${formatRub(totalRub)}`,
  ];
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderBody;

    if (
      !Array.isArray(body.items) ||
      body.totalPrice == null ||
      !body.customerName?.trim() ||
      !body.customerPhone?.trim()
    ) {
      return NextResponse.json(
        { error: "Не указаны items, totalPrice, customerName или customerPhone" },
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

    const text = buildMessage(body);
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
      console.error("Telegram API error:", res.status, err);
      return NextResponse.json(
        { error: "Не удалось отправить уведомление в Telegram" },
        { status: 502 }
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (e) {
    console.error("Order API error:", e);
    return NextResponse.json(
      { error: "Ошибка обработки заказа" },
      { status: 500 }
    );
  }
}
