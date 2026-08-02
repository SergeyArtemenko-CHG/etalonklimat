"use client";

import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "chat_widget_messages";
const SESSION_STORAGE_KEY = "chat_widget_session_id";
const LEGACY_SESSION_STORAGE_KEY = "chat_widget_session";
const POLL_INTERVAL_MS = 5000;
const MAX_STORED_MESSAGES = 80;

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
    const migrated = arr.map((m: Message) =>
      m.id === "welcome" ? { ...m, text: WELCOME_MSG.text } : m
    );
    return migrated.length > MAX_STORED_MESSAGES
      ? migrated.slice(-MAX_STORED_MESSAGES)
      : migrated;
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed =
      messages.length > MAX_STORED_MESSAGES
        ? messages.slice(-MAX_STORED_MESSAGES)
        : messages;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
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
      return migrated;
    }

    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored && (stored || "").trim()) return stored.trim();
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, newId);
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
  const messagesRef = useRef<Message[]>([]);
  const sessionIdRef = useRef<string>("");
  const pollActiveRef = useRef(false);

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
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Опрос ответов — только когда чат открыт или ждём ответ менеджера
  const shouldPoll = isOpen || isTyping || isSending;

  useEffect(() => {
    if (!shouldPoll) {
      pollActiveRef.current = false;
      return;
    }

    const sid = (sessionId || "").trim() || (sessionIdRef.current || "").trim();
    if (!sid) return;

    pollActiveRef.current = true;

    const fetchReplies = async () => {
      if (!pollActiveRef.current) return;

      const currentSession = (sessionIdRef.current || sessionId || "").trim();
      if (!currentSession) return;

      try {
        const res = await fetch("/api/chat-replies?t=" + Date.now(), {
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
        if (!res.ok || !pollActiveRef.current) return;

        let data: { replies?: { text?: string }[]; typing?: boolean; status?: string } = {
          replies: [],
        };
        try {
          data = JSON.parse(raw);
        } catch {
          return;
        }

        const replies = Array.isArray(data.replies) ? data.replies : [];
        const serverTyping =
          data.typing === true ||
          data.status === "typing" ||
          data.status === "pending";

        if (serverTyping) {
          setIsTyping((prev) => (prev ? prev : true));
        }

        if (replies.length) {
          const newReplies: Message[] = replies.map((r) => {
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
            const deduped = newReplies.filter(
              (nr) =>
                !safePrev.some(
                  (p) => p.role === "max" && p.text.trim() === nr.text.trim()
                )
            );
            if (deduped.length === 0) return safePrev;
            const next = [...safePrev, ...deduped];
            saveMessages(next);
            return next;
          });
          setIsTyping(false);
        } else if (!serverTyping) {
          setIsTyping((prev) => (prev ? false : prev));
        }
      } catch {
        setIsTyping((prev) => (prev ? false : prev));
      }
    };

    void fetchReplies();
    const id = window.setInterval(fetchReplies, POLL_INTERVAL_MS);

    return () => {
      pollActiveRef.current = false;
      window.clearInterval(id);
    };
  }, [sessionId, shouldPoll]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const clientMsg: Message = { role: "client", text, id: genId() };
    setMessages((prev) => [...prev, clientMsg]);
    setIsSending(true);
    setIsTyping(true);

    try {
      const sid = (sessionId || "").trim() || getSessionId();
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
      className={`fixed bottom-3 right-4 md:bottom-5 md:right-5 z-[9999] isolate transition-all duration-500 ${
        showWidget ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      {/* Окно чата с плавным появлением */}
      <div
        className={`absolute bottom-[5.25rem] right-0 z-20 flex w-[340px] max-w-[calc(100vw-3rem)] flex-col rounded-xl border border-text-muted/25 bg-card-bg shadow-lg transition-all duration-300 ${
          isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
        style={{ height: "420px" }}
      >
          {/* Шапка: менеджер и аватар */}
          <div className="flex shrink-0 items-center gap-3 border-b border-text-muted/25 px-3 py-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
              СС
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text-main">Сергей Снегирев</p>
              <p className="text-xs text-text-muted">менеджер по продажам</p>
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
                  <span className="mb-0.5 px-1 text-xs text-text-muted">
                    {m.role === "client" ? "Вы" : "Сергей"}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === "client"
                        ? "bg-[#0088cc] text-white"
                        : "bg-text-muted/15 text-text-main"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col items-start">
                  <span className="mb-0.5 px-1 text-xs text-text-muted">Сергей</span>
                  <div className="max-w-[85%] rounded-2xl bg-text-muted/15 px-3 py-2 text-xs text-text-muted italic">
                    печатает...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-text-muted/25 p-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Напишите сообщение..."
                  disabled={isSending}
                  className="flex-1 rounded-full border border-text-muted/25 px-4 py-2 text-sm outline-none focus:border-accent disabled:bg-text-muted/5"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !input.trim()}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
                >
                  {isSending ? "…" : "Отпр."}
                </button>
              </div>
              <p className="mt-2 px-1 text-center text-xs leading-snug text-text-muted">
                Чат предназначен исключительно для технических консультаций, не отправляйте в чате
                Ваши персональные данные
              </p>
            </div>
          </div>
        </div>

      {/* Кнопка чата — только иконка */}
      <div className="absolute bottom-0 right-0 z-10">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-none bg-[#91c73e] text-[#0e2e39] shadow-lg transition hover:bg-[#7fb534] hover:shadow-xl"
          aria-label={isOpen ? "Закрыть чат" : "Открыть чат — помощь в подборе"}
        >
          {isOpen ? (
            <CloseIcon className="h-8 w-8 shrink-0" />
          ) : (
            <ChatIcon className="h-8 w-8 shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
}
