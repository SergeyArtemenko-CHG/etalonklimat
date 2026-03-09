import { NextRequest, NextResponse } from "next/server";
import { getReplies } from "@/lib/chat-replies-storage";

export async function GET(request: NextRequest) {
  try {
    const sessionParam = request.nextUrl.searchParams.get("session");
    const sessionId =
      typeof sessionParam === "string" ? decodeURIComponent(sessionParam).trim() : "";

    if (!sessionId) {
      return NextResponse.json(
        { replies: [] },
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const replies = await getReplies(sessionId);

    const body = JSON.stringify({
      replies: replies.map((r) => ({ text: r.text, timestamp: r.timestamp })),
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
