export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";

const FILE_PATH = "/tmp/chat_answers.json";

const NO_STORE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
} as const;

function emptyReplies(status = 200) {
  return NextResponse.json({ replies: [] }, { status, headers: NO_STORE_HEADERS });
}

function normalizeId(value: string): string {
  return (value || "").trim().replace(/^\[|\]$/g, "").trim();
}

function decodeAnswer(answer: string): string {
  try {
    return decodeURIComponent(answer);
  } catch {
    return answer;
  }
}

/** Поддержка sessionId / [sessionId] и частичного совпадения ключа. */
function findMatchedKey(
  map: Record<string, unknown>,
  sessionId: string
): string | null {
  const raw = (sessionId || "").trim();
  if (!raw) return null;

  const bare = normalizeId(raw);
  const candidates = [raw, bare, `[${bare}]`];

  for (const candidate of candidates) {
    if (
      candidate &&
      Object.prototype.hasOwnProperty.call(map, candidate) &&
      typeof map[candidate] === "string"
    ) {
      return candidate;
    }
  }

  for (const key of Object.keys(map)) {
    if (typeof map[key] !== "string") continue;
    const keyBare = normalizeId(key);
    if (
      keyBare === bare ||
      key.includes(bare) ||
      (keyBare && bare.includes(keyBare))
    ) {
      return key;
    }
  }

  return null;
}

function readAnswersMap(): Record<string, unknown> {
  if (!fs.existsSync(FILE_PATH)) return {};
  try {
    const raw = fs.readFileSync(FILE_PATH, { encoding: "utf8", flag: "r" });
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch (e) {
    console.error("FS_READ_ERROR:", e);
  }
  return {};
}

function consumeReply(sessionId: string): { text: string } | null {
  const map = readAnswersMap();
  const keys = Object.keys(map);
  console.log("API_LOOKING_FOR:", sessionId, "KEYS_IN_FILE:", keys);

  const matchedKey = findMatchedKey(map, sessionId);
  if (!matchedKey) return null;

  const answer = map[matchedKey];
  if (typeof answer !== "string") return null;

  console.log("API_FOUND_MATCH_FOR:", sessionId, "KEY:", matchedKey);

  delete map[matchedKey];
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(map));
  } catch (e) {
    console.error("FS_WRITE_ERROR:", e);
  }

  return { text: decodeAnswer(answer) };
}

async function resolveSessionId(request: NextRequest): Promise<string> {
  if (request.method === "GET") {
    const fromQuery =
      request.nextUrl.searchParams.get("sessionId") ||
      request.nextUrl.searchParams.get("chatId") ||
      "";
    try {
      return (decodeURIComponent(fromQuery) || "").trim();
    } catch {
      return fromQuery.trim();
    }
  }

  try {
    const body = await request.json().catch(() => ({}));
    const raw =
      typeof body?.sessionId === "string"
        ? body.sessionId
        : typeof body?.chatId === "string"
          ? body.chatId
          : "";
    try {
      return (decodeURIComponent(raw) || "").trim();
    } catch {
      return (raw || "").trim();
    }
  } catch {
    return "";
  }
}

async function handleChatReplies(request: NextRequest) {
  try {
    const sessionId = await resolveSessionId(request);
    if (!sessionId) return emptyReplies();

    const found = consumeReply(sessionId);
    if (!found) return emptyReplies();

    return NextResponse.json(
      {
        replies: [
          {
            text: found.text,
            role: "max",
            id: "m" + Math.random().toString(36).slice(2),
          },
        ],
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (e) {
    console.error("Chat-replies API error:", e);
    return NextResponse.json(
      { replies: [], error: "Internal Server Error" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/** GET — основной опрос с фронта (не путается с Server Actions). */
export async function GET(request: NextRequest) {
  return handleChatReplies(request);
}

/** POST — совместимость с check_api.js / старыми клиентами. */
export async function POST(request: NextRequest) {
  return handleChatReplies(request);
}
