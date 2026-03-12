export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest } from "next/server";
import fs from "fs";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  Connection: "close",
};

export async function POST(request: NextRequest) {
  try {
    const { sessionId: rawSessionId } = await request.json().catch(() => ({ sessionId: "" }));
    let sessionId = "";
    if (typeof rawSessionId === "string") {
      try {
        sessionId = (decodeURIComponent(rawSessionId) || "").trim();
      } catch {
        sessionId = (rawSessionId || "").trim();
      }
    }

    if (!sessionId) {
      return new Response(JSON.stringify({ replies: [] }), { status: 200, headers: JSON_HEADERS });
    }

    console.log("API_LOOKING_FOR:", sessionId);

    const filePath = "/tmp/chat_answers.json";
    let rawMap: Record<string, string> = {};

    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          rawMap = parsed as Record<string, string>;
        }
      }
    } catch (e) {
      console.error("FS_READ_ERROR:", e);
      rawMap = {};
    }

    const keys = Object.keys(rawMap);
    console.log("SEARCHING:", sessionId, "KEYS_IN_FILE:", keys);

    let answer: string | undefined;
    let matchedKey: string | null = null;
    for (const key in rawMap) {
      if (Object.prototype.hasOwnProperty.call(rawMap, key) && key.includes(sessionId)) {
        matchedKey = key;
        answer = rawMap[key];
        break;
      }
    }

    if (typeof answer === "undefined" || !matchedKey) {
      return new Response(JSON.stringify({ replies: [] }), { status: 200, headers: JSON_HEADERS });
    }

    console.log("API_FOUND_MATCH_FOR:", sessionId);

    delete rawMap[matchedKey];

    try {
      fs.writeFileSync(filePath, JSON.stringify(rawMap));
    } catch (e) {
      console.error("FS_WRITE_ERROR:", e);
    }

    let decoded = answer;
    try {
      decoded = decodeURIComponent(answer);
    } catch {
      decoded = answer;
    }

    const body = JSON.stringify({
      replies: [{ text: decoded, role: "max", id: Date.now() }],
      salt: Math.random(),
    });

    return new Response(body, { status: 200, headers: JSON_HEADERS });
  } catch (e) {
    console.error("Chat-replies API error:", e);
    return new Response(JSON.stringify({ replies: [], error: "Internal Server Error" }), {
      status: 500,
      headers: { ...JSON_HEADERS },
    });
  }
}
