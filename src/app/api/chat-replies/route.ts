export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextRequest } from "next/server";
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

    // 1. Если сессии нет, возвращаем пустой массив (нативный Response)
    if (!sessionId) {
      return new Response(JSON.stringify({ replies: [] }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0" 
        },
      });
    }

    console.log("API_LOOKING_FOR:", sessionId);

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
        rawMap = {};
      }
    }

    const keys = Object.keys(rawMap);
    console.log("KEYS_IN_FILE:", keys);

    // 2. Поиск ответа (три варианта ключа)
    const keyPlain = sessionId;
    const keyBracketed = `[${sessionId}]`;
    const keyEncoded = encodeURIComponent(sessionId);

    const val1 = rawMap[keyPlain];
    const val2 = rawMap[keyBracketed];
    const val3 = rawMap[keyEncoded];

    let foundAnswer: string | undefined;
    if (typeof val2 !== "undefined") {
      foundAnswer = val2;
    } else if (typeof val1 !== "undefined") {
      foundAnswer = val1;
    } else if (typeof val3 !== "undefined") {
      foundAnswer = val3;
    }

    if (typeof foundAnswer === "undefined") {
      return new Response(JSON.stringify({ replies: [] }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-store" 
        },
      });
    }

    console.log("API_MATCH_FOUND:", sessionId);

    // 3. Удаляем использованные ключи
    delete rawMap[keyPlain];
    delete rawMap[keyBracketed];
    delete rawMap[keyEncoded];

    try {
      fs.writeFileSync(filePath, JSON.stringify(rawMap));
    } catch (e) {
      console.error("FS_WRITE_ERROR:", e);
    }

    let decoded = foundAnswer;
    try {
      decoded = decodeURIComponent(foundAnswer);
    } catch {
      // оставляем как есть
    }

    // 4. ФИНАЛЬНЫЙ ОТВЕТ (БЕЗ КИРИЛЛИЦЫ В ЗАГОЛОВКАХ)
    return new Response(JSON.stringify({
      replies: [
        {
          text: decoded,
          role: "max",
          id: Date.now(),
        },
      ],
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

  } catch (e) {
    console.error("Chat-replies API error:", e);
    return new Response(JSON.stringify({ replies: [], error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
