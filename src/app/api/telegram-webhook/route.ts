export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Логируем весь входящий трафик в append-лог
    try {
      fs.appendFileSync("/tmp/webhook_raw.log", JSON.stringify(body) + "\n");
    } catch (e) {
      console.error("WEBHOOK_APPEND_ERROR:", e);
    }

    console.log("WEBHOOK_BODY_RECEIVED:", body?.update_id);

    // 1. ПРЯМАЯ ЗАПИСЬ ВСЕГО ВХОДЯЩЕГО (для теста связи)
    fs.writeFileSync("/tmp/last_tg_raw.json", JSON.stringify(body, null, 2));

    const rawReplyText = body?.message?.reply_to_message?.text;
    const replyToText = typeof rawReplyText === "string" ? rawReplyText : "";
    const match = replyToText.match(/ID:\s*(\S+)/);

    if (match && body.message?.text) {
      const sessionId = (match[1] || "").trim().replace(/[\[\]]/g, "");
      const answer = encodeURIComponent(body.message.text);
      
      const filePath = "/tmp/chat_answers.json";
      let answers: Record<string, string> = {};
      let canWrite = true;

      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            answers = parsed as Record<string, string>;
          }
        } catch (e) {
          console.error("CHAT_ANSWERS_PARSE_ERROR:", e);
          // если не удалось распарсить существующий файл, не затираем его пустым объектом
          canWrite = false;
        }
      }

      answers[sessionId] = answer;

      if (canWrite) {
        try {
          fs.writeFileSync(filePath, JSON.stringify(answers));
        } catch (e) {
          console.error("CHAT_ANSWERS_WRITE_ERROR:", e);
        }
      }
      console.log("!!! SUCCESS SAVE ID:", sessionId);
    }
  } catch (e) {
    console.error("!!! WEBHOOK CRASHED:", e.message);
  }

  return new Response('{"ok":true}', {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
