import { NextRequest } from "next/server";
import fs from "fs";

const ANSWERS_PATH = "/tmp/chat_answers.json";
const DEBUG_LOG_PATH = "/tmp/tg_debug.log";

export async function POST(req: NextRequest) {
  try {
    console.log("WEBHOOK HIT");

    let body: any = null;
    try {
      body = await req.json();
      fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify(body) + "\n");
    } catch {
      // ignore JSON/FS errors
    }

    const okResponse = () =>
      new Response('{"ok":true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    const message = body?.message;
    if (!message) return okResponse();

    const replyTo = message.reply_to_message;
    if (!replyTo) return okResponse();

    const sourceTexts: string[] = [];
    if (typeof replyTo.text === "string") sourceTexts.push(replyTo.text);
    if (typeof message.text === "string") sourceTexts.push(message.text);

    let sessionId: string | null = null;
    for (const t of sourceTexts) {
      const text = t || "";
      const match = text.match(/ID:\s*(\S+)/);
      if (match) {
        sessionId = match[1];
        console.log("Found ID:", match[1]);
        break;
      }
    }

    if (!sessionId || typeof message.text !== "string") {
      console.log("Full Reply Text (no ID):", replyTo?.text || "");
      return okResponse();
    }

    const answer = encodeURIComponent(message.text || "");

    try {
      let answers: Record<string, string> = {};
      if (fs.existsSync(ANSWERS_PATH)) {
        const raw = fs.readFileSync(ANSWERS_PATH, "utf8");
        answers = raw ? JSON.parse(raw) : {};
      }
      answers[sessionId] = answer;
      console.log("SAVING FOR SESSION:", sessionId);
      fs.writeFileSync(ANSWERS_PATH, JSON.stringify(answers));
    } catch {
      // ignore file write errors
    }

    return okResponse();
  } catch {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });
  }
}
