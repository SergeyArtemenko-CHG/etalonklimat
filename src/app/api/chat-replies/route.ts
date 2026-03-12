export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextRequest } from "next/server";
import fs from "fs";

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
      return new Response(
        JSON.stringify({ replies: [], _t: Date.now() }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ replies: [], _t: Date.now() }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
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
      _t: Date.now(),
    });

    return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Chat-replies API error:", e);
    return new Response(JSON.stringify({
      replies: [],
      error: "Internal Server Error",
      _t: Date.now(),
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
