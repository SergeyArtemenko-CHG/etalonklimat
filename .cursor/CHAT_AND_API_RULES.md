# Правила: чат-виджет и API chat-replies

## IMPORTANT ARCHITECTURE

- Логика чата использует **микросервис на порту 3001** (check_api.js).
- **Nginx** проксирует **/api/chat-replies** на этот порт.
- **NEVER** менять URL fetch или логику sessionId в FloatingContactBtn.tsx.
- **Сохранять state protection:** не очищать messages, если API возвращает пустой массив.

## Архитектура

- **check_api.js** — работает на порту **3001**. Файл в корне проекта.
- **Nginx** — все запросы к **/api/chat-replies** проксируются на порт 3001.
- Логика ответов чата **не в Next.js API**. Не искать и не переписывать логику в Next.js.

## Ограничения

1. **Никогда не изменять файл check_api.js.**
2. **Никогда не менять** URL запросов (/api/chat-replies) и логику передачи sessionId в FloatingContactBtn.
3. **State protection:** при пустом ответе или ошибке API — **не очищать и не сбрасывать** стейт сообщений.

## Фронтенд

- Запросы только на **/api/chat-replies**.
- sessionId — как в текущей реализации; не менять.
- При пустом или ошибочном ответе: не вызывать setMessages с пустым/перезаписывающим значением.
