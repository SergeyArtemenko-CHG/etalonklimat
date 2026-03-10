import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const filePath = '/tmp/chat_answers.json';

    if (body.message?.reply_to_message && body.message.text) {
      const originalText = body.message.reply_to_message.text;
      const sessionIdMatch = originalText.match(/ID:\s*(\d+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        const answer = body.message.text;

        let answers = {};
        if (fs.existsSync(filePath)) {
          answers = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        
        answers[sessionId] = answer;
        fs.writeFileSync(filePath, JSON.stringify(answers));
      }
    }
    // Возвращаем пустой ответ БЕЗ заголовков с кириллицей
    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new NextResponse(JSON.stringify({ ok: false }), { status: 200 });
  }
}
