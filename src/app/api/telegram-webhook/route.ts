export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
import fs from "fs";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 1. ПРЯМАЯ ЗАПИСЬ ВСЕГО ВХОДЯЩЕГО (для теста связи)
    fs.writeFileSync("/tmp/last_tg_raw.json", JSON.stringify(body, null, 2));

    const replyToText = body?.message?.reply_to_message?.text || "";
    const match = replyToText.match(/ID:\s*(\S+)/);

    if (match && body.message?.text) {
      const sessionId = (match[1] || "").trim().replace(/[\[\]]/g, "");
      const answer = encodeURIComponent(body.message.text);
      
      const filePath = "/tmp/chat_answers.json";
      let answers = {};
      if (fs.existsSync(filePath)) {
        try { answers = JSON.parse(fs.readFileSync(filePath, "utf8")); } catch(e) {}
      }
      answers[sessionId] = answer;
      fs.writeFileSync(filePath, JSON.stringify(answers));
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
