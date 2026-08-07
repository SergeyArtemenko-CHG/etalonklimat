const http = require("http");
const fs = require("fs");
const { URL } = require("url");

const FILE_PATH = "/tmp/chat_answers.json";
const WEBHOOK_LOG = "/tmp/webhook_raw.log";
const LAST_TG_RAW = "/tmp/last_tg_raw.json";
const PORT = Number(process.env.CHAT_API_PORT || 3001);

function normalizeId(value) {
  return String(value || "")
    .trim()
    .replace(/[\[\]]/g, "")
    .trim();
}

function readAnswersMap() {
  if (!fs.existsSync(FILE_PATH)) return {};
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (e) {
    console.error("FS_READ_ERROR:", e);
  }
  return {};
}

function writeAnswersMap(map) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(map));
}

/**
 * Сохраняем ответ менеджера.
 * Ключ — «голый» sessionId без скобок (как ищет фронт / findMatchedKey).
 * Значение — encodeURIComponent(text), как раньше писал Next webhook.
 */
function saveTelegramReply(sessionId, text) {
  const key = normalizeId(sessionId);
  if (!key || !text) return false;

  let answers = {};
  let canWrite = true;

  if (fs.existsSync(FILE_PATH)) {
    try {
      const raw = fs.readFileSync(FILE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        answers = parsed;
      }
    } catch (e) {
      console.error("CHAT_ANSWERS_PARSE_ERROR:", e);
      canWrite = false;
    }
  }

  answers[key] = encodeURIComponent(String(text));

  if (!canWrite) return false;

  try {
    writeAnswersMap(answers);
    console.log("!!! SUCCESS SAVE ID:", key);
    return true;
  } catch (e) {
    console.error("CHAT_ANSWERS_WRITE_ERROR:", e);
    return false;
  }
}

function findMatchedKey(map, sessionId) {
  const raw = String(sessionId || "").trim();
  if (!raw) return null;

  const bare = normalizeId(raw);
  const candidates = [raw, bare, "[" + bare + "]"];

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
  const data = readAnswersMap();
  const keys = Object.keys(data);
  console.log("API_LOOKING_FOR:", sessionId, "KEYS_IN_FILE:", keys);

  const key = findMatchedKey(data, sessionId);
  if (!key || typeof data[key] !== "string") return null;

  const text = decodeAnswer(data[key]);
  delete data[key];
  writeAnswersMap(data);
  console.log("SENT REPLY FOR:", sessionId, "KEY:", key);
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

/**
 * Telegram update → sessionId из reply_to_message с меткой ID: [...].
 * Сообщение менеджера: body.message.text
 */
function handleTelegramWebhook(body) {
  try {
    fs.appendFileSync(WEBHOOK_LOG, JSON.stringify(body) + "\n");
  } catch (e) {
    console.error("WEBHOOK_APPEND_ERROR:", e);
  }

  try {
    fs.writeFileSync(LAST_TG_RAW, JSON.stringify(body, null, 2));
  } catch (e) {
    console.error("LAST_TG_RAW_ERROR:", e);
  }

  console.log("WEBHOOK_BODY_RECEIVED:", body && body.update_id);

  const msg = body && body.message;
  if (!msg) {
    console.log("WEBHOOK_SKIP: no message");
    return;
  }

  const replyToText =
    msg.reply_to_message && typeof msg.reply_to_message.text === "string"
      ? msg.reply_to_message.text
      : "";
  const answerText = typeof msg.text === "string" ? msg.text : "";

  // ID: [sessionId] или ID: sessionId  (как в contact-message)
  const match = replyToText.match(/ID:\s*\[?([^\s\]]+)\]?/);
  if (!match) {
    console.log("WEBHOOK_SKIP: no ID in reply_to_message. reply_to=", replyToText.slice(0, 120));
    return;
  }
  if (!answerText) {
    console.log("WEBHOOK_SKIP: empty manager text");
    return;
  }

  const sessionId = normalizeId(match[1]);
  saveTelegramReply(sessionId, answerText);
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

function pathName(reqUrl) {
  return String(reqUrl || "").split("?")[0];
}

function isPath(pathOnly, suffix) {
  return pathOnly === suffix || pathOnly.endsWith(suffix);
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", () => resolve(""));
  });
}

http
  .createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
      });
      res.end();
      return;
    }

    const pathOnly = pathName(req.url);
    const isChatReplies = isPath(pathOnly, "/api/chat-replies");
    const isWebhook = isPath(pathOnly, "/api/telegram-webhook");

    // --- Telegram webhook: только запись ответов ---
    if (isWebhook) {
      if (req.method !== "POST") {
        sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
        return;
      }

      try {
        const raw = await readBody(req);
        let body = {};
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch (e) {
          console.error("WEBHOOK_JSON_ERROR:", e);
        }
        handleTelegramWebhook(body);
      } catch (e) {
        console.error("!!! WEBHOOK CRASHED:", e && e.message ? e.message : e);
      }

      // Telegram всегда ждёт 200 ok
      sendJson(res, 200, { ok: true });
      return;
    }

    // --- Опрос ответов фронтом ---
    if (isChatReplies) {
      if (req.method !== "GET" && req.method !== "POST") {
        sendJson(res, 405, { replies: [], error: "Method Not Allowed" });
        return;
      }

      try {
        const raw = await readBody(req);
        const sessionId = readSessionId(req, raw);
        let replies = [];

        if (sessionId) {
          const text = consumeReply(sessionId);
          if (text != null) {
            replies = [{ text, role: "max", id: Date.now().toString() }];
          }
        } else {
          console.log("API_LOOKING_FOR: (empty sessionId)");
        }

        sendJson(res, 200, { replies });
      } catch (e) {
        console.error("Parse error:", e);
        sendJson(res, 200, { replies: [] });
      }
      return;
    }

    res.writeHead(404);
    res.end();
  })
  .listen(PORT);

console.log("Micro-API webhook+replies on port " + PORT);
