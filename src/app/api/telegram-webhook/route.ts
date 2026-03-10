import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// Принудительно отключаем все фишки Next.js для этого роута
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ANSWERS_PATH = "/tmp/chat_answers.json";

export async function POST(req: NextRequest) {
  // 1. Сразу читаем тело, чтобы Telegram не ждал
  const body = await req.json();
  
  // 2. Логика обработки (в блоке try, чтобы не уронить сервер)
  try {
    const message = body?.message;
    const replyTo = message?.reply_to_message;

    if (replyTo && message.text) {
      const text = replyTo.text || "";
      const match = text.match(/ID:\s*(\S+)/);
      
      if (match) {
        const sessionId = match[1];
        const answer = encodeURIComponent(message.text);

        let answers = {};
        if (fs.existsSync(ANSWERS_PATH)) {
          answers = JSON.parse(fs.readFileSync(ANSWERS_PATH, "utf8"));
        }
        answers[sessionId] = answer;
        fs.writeFileSync(ANSWERS_PATH, JSON.stringify(answers));
        console.log("SUCCESS: Answer saved for", sessionId);
      }
    }
  } catch (e) {
    console.log("WORKER ERROR:", e.message);
  }

  // 3. САМОЕ ВАЖНОЕ: Возвращаем чистейший ответ, который не вызовет ByteString
  return new Response('{"ok":true}', {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Connection': 'close' // Говорим Telegram сразу закрыть соединение
    }
  });
}
