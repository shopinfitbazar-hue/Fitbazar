"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, TriangleAlert, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

const toastStyles: Record<ToastType, string> = {
  success: "border-l-[4px] border-success",
  error: "border-l-[4px] border-fb-pink",
  info: "border-l-[4px] border-fb-orange",
};

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: TriangleAlert,
};

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed inset-x-0 bottom-[84px] z-[1200] flex flex-col items-center gap-3 px-4 md:bottom-6">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type];

          return (
            <button
              key={toast.id}
              type="button"
              onClick={() => removeToast(toast.id)}
              className={`flex w-full max-w-[440px] items-center gap-3 rounded-[8px] bg-card px-4 py-3 text-left shadow-[var(--shadow-md)] ${toastStyles[toast.type]}`}
            >
              <Icon className="h-4 w-4 shrink-0 text-text-secondary" />
              <span className="flex-1 text-[14px] font-medium text-text-primary">{toast.message}</span>
              <X className="h-4 w-4 shrink-0 text-text-muted" />
            </button>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
