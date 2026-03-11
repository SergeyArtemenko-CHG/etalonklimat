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

    // сначала ищем по чистому sessionId
    let rawValue = rawMap[sessionId];

    // если нет — пробуем legacy-ключ с квадратными скобками
    if (typeof rawValue === "undefined") {
      const legacyKey = `[${sessionId}]`;
      rawValue = rawMap[legacyKey];
      if (typeof rawValue !== "undefined") {
        // удаляем legacy-ключ, чтобы не слать повторно
        delete rawMap[legacyKey];
      }
    } else {
      // если нашли по чистому ключу — тоже удаляем, чтобы не повторять ответ
      delete rawMap[sessionId];
    }

    // если так и не нашли — просто возвращаем пустой массив
    if (typeof rawValue === "undefined") {
      return NextResponse.json(
        { replies: [] },
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    // сохраняем обновлённую карту (без уже выданного ответа)
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
