import { NextRequest } from "next/server";
import fs from "fs";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionIdMatch = body?.message?.reply_to_message?.text?.match(/ID:\s*(\S+)/);

    if (sessionIdMatch && body.message.text) {
      const sessionId = sessionIdMatch[1];
      const answer = encodeURIComponent(body.message.text);
      
      const filePath = "/tmp/chat_answers.json";
      let answers = {};
      if (fs.existsSync(filePath)) {
        answers = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
      answers[sessionId] = answer;
      fs.writeFileSync(filePath, JSON.stringify(answers));
      console.log("SUCCESS_SAVE_ID:", sessionId);
    }
  } catch (e) {
    // Тихо игнорируем ошибки логики, чтобы не пугать Telegram
  }

  // ОТВЕТ БЕЗ КИРИЛЛИЦЫ (важнейшая часть)
  return new Response('{"ok":true}', {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
