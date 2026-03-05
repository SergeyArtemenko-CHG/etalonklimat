"use client";

import { useToastStore } from "@/store/toast";

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex max-w-xs items-start gap-2 rounded-xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-lg shadow-slate-900/40"
        >
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="ml-2 rounded-full p-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Закрыть уведомление"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

