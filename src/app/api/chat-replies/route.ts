export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextRequest } from "next/server";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const { sessionId: rawSessionId } = await request.json().catch(() => ({ sessionId: "" }));
    let sessionId = "";
    if (typeof rawSessionId === "string") {
      try {
        sessionId = (decodeURIComponent(rawSessionId) || "").trim();
      } catch {
        sessionId = (rawSessionId || "").trim();
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
    console.log("SEARCHING:", sessionId, "KEYS_IN_FILE:", keys);

    // 2. Поиск ответа: чистый ID или ID в скобках
    const keyPlain = sessionId;
    const keyBracketed = `[${sessionId}]`;

    const answer = rawMap[keyPlain] || rawMap[keyBracketed];

    if (typeof answer === "undefined") {
      return new Response(JSON.stringify({ replies: [] }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-store" 
        },
      });
    }

    console.log("API_MATCH_FOUND:", sessionId);

    // 3. Удаляем оба варианта ключей
    delete rawMap[keyPlain];
    delete rawMap[keyBracketed];

    try {
      fs.writeFileSync(filePath, JSON.stringify(rawMap));
    } catch (e) {
      console.error("FS_WRITE_ERROR:", e);
    }

    let decoded = answer;
    try {
      decoded = decodeURIComponent(answer);
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
