import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";

const STORAGE_FILE = path.join(os.tmpdir(), "chat_answers.json");

export type ReplyRecord = {
  text: string;
  timestamp: number;
};

type Storage = Record<string, ReplyRecord[]>;

async function readStorage(): Promise<Storage> {
  try {
    if (existsSync(STORAGE_FILE)) {
      const raw = await readFile(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    }
  } catch {
    // ignore
  }
  return {};
}

async function writeStorage(data: Storage): Promise<void> {
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(STORAGE_FILE, JSON.stringify(data, null, 0), "utf-8");
  } catch (e) {
    console.error("chat_answers write error:", e);
  }
}

export async function addReply(sessionId: string, text: string): Promise<void> {
  const storage = await readStorage();
  const list = storage[sessionId] ?? [];
  list.push({ text: encodeURIComponent(text), timestamp: Date.now() });
  storage[sessionId] = list.slice(-50); // keep last 50
  await writeStorage(storage);
}

export async function getReplies(sessionId: string): Promise<ReplyRecord[]> {
  const storage = await readStorage();
  return storage[sessionId] ?? [];
}

export async function clearReplies(sessionId: string): Promise<void> {
  const storage = await readStorage();
  delete storage[sessionId];
  await writeStorage(storage);
}
