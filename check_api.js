const http = require("http");
const fs = require("fs");
const { URL } = require("url");

const FILE_PATH = "/tmp/chat_answers.json";
const PORT = Number(process.env.CHAT_API_PORT || 3001);

function normalizeId(value) {
  return String(value || "")
    .trim()
    .replace(/^\[|\]$/g, "")
    .trim();
}

function findMatchedKey(map, sessionId) {
  const raw = String(sessionId || "").trim();
  if (!raw) return null;

  const bare = normalizeId(raw);
  const candidates = [raw, bare, "[" + bare + "]"];

  for (const candidate of candidates) {
    if (candidate && Object.prototype.hasOwnProperty.call(map, candidate) && typeof map[candidate] === "string") {
      return candidate;
    }
  }

  for (const key of Object.keys(map)) {
    if (typeof map[key] !== "string") continue;
    const keyBare = normalizeId(key);
    if (keyBare === bare || key.includes(bare) || (keyBare && bare.includes(keyBare))) {
      return key;
    }
  }

  return null;
}

function decodeAnswer(answer) {
  try {
    return decodeURIComponent(answer);
  } catch {
    return answer;
  }
}

function consumeReply(sessionId) {
  if (!fs.existsSync(FILE_PATH)) return null;

  const raw = fs.readFileSync(FILE_PATH, "utf8");
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object") return null;

  const key = findMatchedKey(data, sessionId);
  if (!key || typeof data[key] !== "string") return null;

  const text = decodeAnswer(data[key]);
  delete data[key];
  fs.writeFileSync(FILE_PATH, JSON.stringify(data));
  console.log("SENT REPLY FOR:", sessionId);
  return text;
}

function readSessionId(req, bodyText) {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const fromQuery = url.searchParams.get("sessionId") || url.searchParams.get("chatId");
    if (fromQuery) return String(fromQuery).trim();
  } catch {
    // ignore
  }

  if (!bodyText) return "";
  try {
    const parsed = JSON.parse(bodyText);
    const sid = parsed.sessionId || parsed.chatId || "";
    return String(sid).trim();
  } catch {
    return "";
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  });
  res.end(JSON.stringify(payload));
}

http
  .createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
      });
      res.end();
      return;
    }

    const pathOnly = String(req.url || "").split("?")[0];
    const isChatReplies =
      pathOnly === "/api/chat-replies" || pathOnly.endsWith("/api/chat-replies");

    if (!isChatReplies || (req.method !== "GET" && req.method !== "POST")) {
      res.writeHead(404);
      res.end();
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const sessionId = readSessionId(req, body);
        let replies = [];

        if (sessionId) {
          const text = consumeReply(sessionId);
          if (text != null) {
            replies = [{ text, role: "max", id: Date.now().toString() }];
          }
        }

        sendJson(res, 200, { replies });
      } catch (e) {
        console.error("Parse error:", e);
        sendJson(res, 200, { replies: [] });
      }
    });
  })
  .listen(PORT);

console.log("Micro-API (GET/POST) running on port " + PORT);
