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
};

function formatRub(num: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(num)) + " руб.";
}

function generateOrderNumber(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `EK-${n}`;
}

function calculateTotalRub(items: OrderItem[], rate: number): number {
  return items.reduce((sum, item) => {
    if (item.priceRub != null && item.priceRub > 0) {
      return sum + item.priceRub * item.quantity;
    }
    return sum + (item.priceEur ?? 0) * rate * item.quantity;
  }, 0);
}

function linePriceRub(
  item: OrderItem,
  rate: number
): number {
  const isRub = item.priceRub != null && item.priceRub > 0;
  if (isRub) return item.priceRub! * item.quantity;
  return (item.priceEur ?? 0) * rate * item.quantity;
}

function buildTelegramMessage(body: OrderBody, orderNumber: string): string {
  const rate = body.rate ?? 1;
  const totalRub =
    body.rate != null
      ? calculateTotalRub(body.items, rate)
      : typeof body.totalPrice === "number"
        ? body.totalPrice
        : parseFloat(
            String(body.totalPrice)
              .replace(/\s/g, "")
              .replace(/[^\d.,-]/g, "")
              .replace(",", ".")
          ) || 0;

  const skuLines = body.items.map((item) => {
    const sku = (item.id ?? "—").trim() || "—";
    const qty = item.quantity;
    const lineTotal = formatRub(linePriceRub(item, rate));
    return `${sku} - ${qty} шт. - ${lineTotal}`;
  });

  return [
    `📦 НОВЫЙ ЗАКАЗ ${orderNumber}`,
    "------------------------",
    "🛒 Состав:",
    ...skuLines,
    "------------------------",
    `💰 ИТОГО: ${formatRub(totalRub)}`,
    "📢 Ждите звонка клиента для подтверждения.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderBody;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Корзина пуста или не указан состав заказа" },
        { status: 400 }
      );
    }

    if (body.totalPrice == null) {
      return NextResponse.json(
        { error: "Не указана сумма заказа" },
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

    const orderNumber = generateOrderNumber();
    const text = buildTelegramMessage(body, orderNumber);
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

    return NextResponse.json({ orderNumber }, { status: 200 });
  } catch (e) {
    console.error("Order API error:", e);
    return NextResponse.json(
      { error: "Ошибка обработки заказа" },
      { status: 500 }
    );
  }
}
