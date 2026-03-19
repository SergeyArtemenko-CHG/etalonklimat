"use client";

import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "chat_widget_messages";
const SESSION_STORAGE_KEY = "chat_widget_session_id";
const LEGACY_SESSION_STORAGE_KEY = "chat_widget_session";

type Message = { role: "client" | "max"; text: string; id: string };

const WELCOME_MSG: Message = {
  role: "max",
  text: "Если у вас есть вопрос по оборудованию, пожалуйста, напишите мне. Я помогу.",
  id: "welcome",
};

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [];
    // Миграция: обновить старое приветствие на актуальный текст
    return arr.map((m: Message) =>
      m.id === "welcome" ? { ...m, text: WELCOME_MSG.text } : m
    );
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    // migrate from old key if needed
    const legacy = localStorage.getItem(LEGACY_SESSION_STORAGE_KEY);
    if (legacy && legacy.trim()) {
      const migrated = legacy.trim();
      localStorage.setItem(SESSION_STORAGE_KEY, migrated);
      localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      console.log("SESSION_ID_SAVED:", migrated);
      return migrated;
    }

    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored && (stored || "").trim()) return stored.trim();
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, newId);
    console.log("SESSION_ID_SAVED:", newId);
    return newId;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function FloatingContactBtn() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastReplyIdxRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    const sid = getSessionId();
    if (sid) {
      setSessionId(sid);
      sessionIdRef.current = sid;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setIsOpen(true);
    window.addEventListener("open-chat-widget", handler);
    return () => {
      window.removeEventListener("open-chat-widget", handler);
    };
  }, []);

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  const welcomeAddedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      welcomeAddedRef.current = true;
      setMessages((prev) => {
        const hasWelcome = prev.some((m) => m.id === "welcome");
        if (hasWelcome) return prev;
        const next = [...prev, WELCOME_MSG];
        saveMessages(next);
        return next;
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen || !welcomeAddedRef.current) return;
    setMessages((prev) => {
      const hasWelcome = prev.some((m) => m.id === "welcome");
      if (hasWelcome) return prev;
      const next = [...prev, WELCOME_MSG];
      saveMessages(next);
      return next;
    });
  }, [isOpen]);

  useEffect(() => {
    saveMessages(messages);
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (sessionId && (sessionId || "").trim()) {
      sessionIdRef.current = sessionId.trim();
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const sid = (sessionId || "").trim() || (sessionIdRef.current || "").trim();
    if (!sid) return;

    const fetchReplies = async () => {
      const currentSession = (sessionIdRef.current || sessionId || "").trim();
      if (!currentSession) return;
      console.log(
        "Poll cycle:",
        new Date().toLocaleTimeString(),
        "Messages count:",
        messagesRef.current.length
      );
      console.log("Fetching for ID:", currentSession);
      try {
        const url = "/api/chat-replies?t=" + Date.now();
        const res = await fetch(url, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Pragma: "no-cache",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({ sessionId: currentSession, _t: Date.now() }),
        });
        const raw = await res.text();
        if (!res.ok) return;
        let data: any = { replies: [] };
        try {
          data = JSON.parse(raw);
        } catch {
          return;
        }
        const replies = Array.isArray(data.replies) ? data.replies : [];
        // Показываем typing только при ответе сервера: typing или статус «в процессе»
        const serverTyping = data.typing === true || data.status === "typing" || data.status === "pending";
        if (serverTyping) setIsTyping(true);
        if (replies.length) {
          const newReplies: Message[] = replies.map((r: { text?: string }) => {
            let text = (r?.text ?? "").toString();
            try {
              text = decodeURIComponent(text);
            } catch {
              // leave as is
            }
            return {
              role: "max" as const,
              text,
              id: "r-" + Math.random().toString(36).slice(2),
            };
          });
          setMessages((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const next = [...safePrev, ...newReplies];
            saveMessages(next); // сохраняем сразу, чтобы не потерять при возможном remount
            return next;
          });
          setIsTyping(false);
        } else if (!serverTyping) {
          setIsTyping(false);
        }
      } catch {
        setIsTyping(false);
      }
    };

    const id = setInterval(fetchReplies, 3000);
    fetchReplies();
    return () => clearInterval(id);
  }, [sessionId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const clientMsg: Message = { role: "client", text, id: genId() };
    setMessages((prev) => [...prev, clientMsg]);
    setIsSending(true);

    try {
      const sid = (sessionId || "").trim() || getSessionId();
      console.log("SENDING WITH ID:", sid);
      const res = await fetch("/api/contact-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sid,
          website: "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      setInput("");
      if (!sessionId && data.sessionId && typeof data.sessionId === "string") {
        const newSid = (data.sessionId || "").trim();
        if (newSid) {
          setSessionId(newSid);
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, newSid);
          } catch {}
        }
      }
    } catch {
      // сообщение уже добавлено, просто не показываем ошибку
    } finally {
      setIsSending(false);
    }
  };

  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowWidget(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      ref={menuRef}
      className={`fixed bottom-24 right-4 md:bottom-5 md:right-5 z-[9999] isolate transition-all duration-500 ${
        showWidget ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      {/* Окно чата с плавным появлением */}
      <div
        className={`absolute bottom-16 right-0 z-20 flex w-[340px] max-w-[calc(100vw-3rem)] flex-col rounded-xl border border-slate-200 bg-white shadow-lg transition-all duration-300 ${
          isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
        style={{ height: "420px" }}
      >
          {/* Шапка: менеджер и аватар */}
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-3 py-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF8C00]/20 text-sm font-semibold text-[#FF8C00]">
              СС
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-800">Сергей Снегирев</p>
              <p className="text-xs text-slate-500">менеджер по продажам</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Мы онлайн
            </span>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === "client" ? "items-end" : "items-start"}`}
                >
                  <span className="mb-0.5 px-1 text-xs text-slate-500">
                    {m.role === "client" ? "Вы" : "Сергей"}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "client"
                        ? "bg-[#0088cc] text-white"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col items-start">
                  <span className="mb-0.5 px-1 text-xs text-slate-500">Сергей</span>
                  <div className="max-w-[85%] rounded-2xl bg-slate-200 px-3 py-2 text-xs text-slate-500 italic">
                    печатает...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 p-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Напишите сообщение..."
                  disabled={isSending}
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#FF8C00] disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !input.trim()}
                  className="rounded-full bg-[#FF8C00] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ff9f26] disabled:opacity-60"
                >
                  {isSending ? "…" : "Отпр."}
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Кнопка чата с надписью «Помощь в подборе» и зелёной точкой статуса */}
      <div className="absolute bottom-0 right-0 z-10 flex items-center gap-2">
        <div className="relative shrink-0">
          {!isOpen && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white"
              aria-hidden
            />
          )}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="flex h-14 items-center gap-2 rounded-full bg-[#FF8C00] pl-3 pr-4 text-white shadow-lg transition hover:bg-[#ff9f26] hover:shadow-xl"
            aria-label={isOpen ? "Закрыть чат" : "Открыть чат — помощь в подборе"}
          >
            {isOpen ? (
              <CloseIcon className="h-6 w-6 shrink-0" />
            ) : (
              <>
                <ChatIcon className="h-6 w-6 shrink-0" />
                <span className="whitespace-nowrap text-sm font-medium">Помощь в подборе</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
