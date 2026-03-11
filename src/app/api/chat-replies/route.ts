import { NextRequest, NextResponse } from "next/server";
import { getReplies } from "@/lib/chat-replies-storage";

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

    // основная попытка — чистый sessionId
    let replies = await getReplies(sessionId);

    // fallback для старых записей с ключом в квадратных скобках
    if ((!replies || replies.length === 0) && sessionId) {
      const legacyKey = `[${sessionId}]`;
      const legacyReplies = await getReplies(legacyKey);
      if (legacyReplies && legacyReplies.length > 0) {
        replies = legacyReplies;
      }
    }

    const body = JSON.stringify({
      replies: (replies || []).map((r) => {
        let text = r.text;
        try {
          text = decodeURIComponent(text);
        } catch {
          // leave as is
        }
        return { text, timestamp: r.timestamp };
      }),
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
