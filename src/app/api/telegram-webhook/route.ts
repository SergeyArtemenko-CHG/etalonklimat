import { NextRequest, NextResponse } from "next/server";
import { addReply } from "@/lib/chat-replies-storage";

function extractSessionId(text: string | undefined): string | null {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/ID:\s*\[([^\]]+)\]/);
  return match ? (match[1] || "").trim() || null : null;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const update = raw && typeof raw === "object" ? raw : {};

    const message = update.message;
    if (!message || typeof message !== "object") {
      return new NextResponse("ok", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const replyTo = message.reply_to_message;
    if (!replyTo || typeof replyTo !== "object") {
      return new NextResponse("ok", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const replyText = typeof message.text === "string" ? message.text.trim() : "";
    if (!replyText) {
      return new NextResponse("ok", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const originalText = replyTo.text;
    const sessionId = extractSessionId(originalText);
    if (!sessionId) {
      return new NextResponse("ok", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    await addReply(sessionId, replyText);

    return new NextResponse("ok", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return new NextResponse("error", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
