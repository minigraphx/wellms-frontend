"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useT } from "../i18n/I18nProvider";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

let _nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const t = useT();

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div role="region" aria-label={t.learner.toast.region} className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            role="alert"
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white flex items-center gap-2 ${
              item.type === "success"
                ? "bg-[#1abc9c]"
                : item.type === "error"
                ? "bg-red-500"
                : "bg-[#04323e]"
            }`}
          >
            <span aria-hidden="true">{item.type === "success" ? "✓" : item.type === "error" ? "✕" : "ℹ"}</span>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
