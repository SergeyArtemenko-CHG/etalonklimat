export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const sessionParam = request.nextUrl.searchParams.get("session");
    let sessionId = "";
    if (typeof sessionParam === "string") {
      try {
        sessionId = (decodeURIComponent(sessionParam) || "").trim();
      } catch {
        sessionId = (sessionParam || "").trim();
      }
    }

    if (!sessionId) {
      return NextResponse.json(
        { replies: [] },
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const filePath = "/tmp/chat_answers.json";
    let rawMap: Record<string, string> = {};

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          rawMap = parsed as Record<string, string>;
        }
      } catch {
        // если файл битый — считаем, что ответов нет
        rawMap = {};
      }
    }

    if (!Object.keys(rawMap).length) {
      return NextResponse.json(
        { replies: [] },
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // три варианта ключа:
    // 1) чистый sessionId
    // 2) [sessionId]
    // 3) encodeURIComponent(sessionId)
    const keyPlain = sessionId;
    const keyBracketed = `[${sessionId}]`;
    const keyEncoded = encodeURIComponent(sessionId);

    const val1 = rawMap[keyPlain];
    const val2 = rawMap[keyBracketed];
    const val3 = rawMap[keyEncoded];

    const answer = val1 || val2 || val3;

    if (typeof answer === "undefined") {
      return NextResponse.json(
        { replies: [] },
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // лог для отладки
    console.log("API_MATCH_FOUND:", sessionId);

    // удаляем все возможные варианты ключей, чтобы не было дублей
    delete rawMap[keyPlain];
    delete rawMap[keyBracketed];
    delete rawMap[keyEncoded];

    // сохраняем обновлённую карту
    try {
      fs.writeFileSync(filePath, JSON.stringify(rawMap));
    } catch {
      // если не удалось записать — это не должно ломать выдачу ответа
    }

    let decoded = answer;
    try {
      decoded = decodeURIComponent(answer);
    } catch {
      // оставляем как есть
    }

    const body = JSON.stringify({
      replies: [
        {
          text: decoded,
          role: "max",
          id: Date.now(),
        },
      ],
    });

    return new NextResponse(body, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    console.error("Chat-replies API error:", e);
    return NextResponse.json(
      { error: "Ошибка загрузки ответов", replies: [] },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
