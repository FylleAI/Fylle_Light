import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-xl border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-bottom-5",
            toast.variant === "destructive"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-neutral-200 bg-white text-neutral-900"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description && (
                <p className="text-sm text-neutral-500 mt-1">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
