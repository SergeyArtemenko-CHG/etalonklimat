import { NextRequest } from "next/server";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import os from "os";

const TMP_DIR = os.tmpdir();
const ANSWERS_FILE = path.join(TMP_DIR, "chat_answers.json");
const DEBUG_LOG = path.join(TMP_DIR, "tg_debug.log");

function extractSessionId(text: string | undefined): string | null {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/ID:\s*\[([^\]]+)\]/);
  return match ? ((match[1] || "").trim() || null) : null;
}

function readAnswers(): Record<string, { text: string; timestamp: number }[]> {
  try {
    if (existsSync(ANSWERS_FILE)) {
      const raw = readFileSync(ANSWERS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    }
  } catch {
    // ignore
  }
  return {};
}

function writeAnswer(sessionId: string, text: string): void {
  try {
    const storage = readAnswers();
    const list = storage[sessionId] ?? [];
    list.push({ text, timestamp: Date.now() });
    storage[sessionId] = list.slice(-50);
    if (!existsSync(TMP_DIR)) {
      mkdirSync(TMP_DIR, { recursive: true });
    }
    writeFileSync(ANSWERS_FILE, JSON.stringify(storage, null, 0), "utf-8");
  } catch (e) {
    console.error("writeAnswer error:", e);
  }
}

export async function POST(request: NextRequest) {
  console.log("WEBHOOK HIT");

  let body: unknown = null;
  try {
    body = await request.json();
    appendFileSync(DEBUG_LOG, JSON.stringify(body) + "\n", "utf-8");
  } catch {
    // ignore
  }

  const okResponse = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const update = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const message = update.message;
    if (!message || typeof message !== "object") {
      return okResponse();
    }

    const msg = message as Record<string, unknown>;
    const replyTo = msg.reply_to_message;
    if (!replyTo || typeof replyTo !== "object") {
      return okResponse();
    }

    const replyText = ((typeof msg.text === "string" ? msg.text : "") || "").trim();
    if (!replyText) {
      return okResponse();
    }

    const originalText = (replyTo as Record<string, unknown>).text;
    const sessionId = extractSessionId(originalText as string | undefined);
    if (!sessionId) {
      return okResponse();
    }

    writeAnswer(sessionId, replyText);
    return okResponse();
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return okResponse();
  }
}
