import { NextResponse } from "next/server";
import { getLatestEurRate } from "@/utils/currency";

/** Курс EUR/RUB с ЦБ РФ. Запрос к CBR выполняется на сервере. */
export async function GET() {
  try {
    const rate = await getLatestEurRate();
    return NextResponse.json({ rate });
  } catch (e) {
    console.error("Currency rate API error:", e);
    return NextResponse.json({ rate: 105 }, { status: 200 });
  }
}
