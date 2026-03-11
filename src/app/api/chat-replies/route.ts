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

    let usedKey: string | null = null;
    let rawValue: string | undefined = undefined;

    if (Object.prototype.hasOwnProperty.call(rawMap, keyPlain)) {
      usedKey = keyPlain;
      rawValue = rawMap[keyPlain];
    } else if (Object.prototype.hasOwnProperty.call(rawMap, keyBracketed)) {
      usedKey = keyBracketed;
      rawValue = rawMap[keyBracketed];
    } else if (Object.prototype.hasOwnProperty.call(rawMap, keyEncoded)) {
      usedKey = keyEncoded;
      rawValue = rawMap[keyEncoded];
    }

    if (typeof rawValue === "undefined" || usedKey === null) {
      return NextResponse.json(
        { replies: [] },
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // лог для отладки
    console.log("API_MATCH_FOUND:", sessionId);

    // удаляем использованный ключ, чтобы сообщение не приходило повторно
    delete rawMap[usedKey];

    // сохраняем обновлённую карту
    try {
      fs.writeFileSync(filePath, JSON.stringify(rawMap));
    } catch {
      // если не удалось записать — это не должно ломать выдачу ответа
    }

    let decoded = rawValue;
    try {
      decoded = decodeURIComponent(rawValue);
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
