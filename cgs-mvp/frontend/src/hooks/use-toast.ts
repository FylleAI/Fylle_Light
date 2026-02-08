import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastCount = 0;
const listeners: Array<(toast: Toast) => void> = [];

function addToast(toast: Omit<Toast, "id">) {
  const id = String(++toastCount);
  const newToast = { ...toast, id };
  listeners.forEach((listener) => listener(newToast));
  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addListener = useCallback(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  // Register listener on first render
  useState(() => addListener());

  return {
    toasts,
    toast: addToast,
    dismiss: (id: string) =>
      setToasts((prev) => prev.filter((t) => t.id !== id)),
  };
}
