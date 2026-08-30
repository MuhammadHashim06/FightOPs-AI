"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  title: string;
  variant: ToastVariant;
};

type ShowToastInput = {
  title: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  showToast: ({ title, variant }: ShowToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(1);
  const timeoutIds = useRef<Map<number, number>>(new Map());

  const dismissToast = useCallback((toastId: number) => {
    const timeoutId = timeoutIds.current.get(toastId);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutIds.current.delete(toastId);
    }

    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    );
  }, []);

  const showToast = useCallback(
    ({ title, variant = "info" }: ShowToastInput) => {
      const toastId = nextToastId.current;
      nextToastId.current += 1;

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id: toastId,
          title,
          variant,
        },
      ]);

      const timeoutId = window.setTimeout(() => {
        dismissToast(toastId);
      }, TOAST_DURATION_MS);

      timeoutIds.current.set(toastId, timeoutId);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (toastId: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (toastId: number) => void;
}) {
  const toneClassName = useMemo(() => {
    switch (toast.variant) {
      case "success":
        return "border-success/20 bg-[rgba(15,159,110,0.1)] text-success";
      case "error":
        return "border-danger/20 bg-[rgba(220,76,100,0.1)] text-danger";
      case "warning":
        return "border-warning/20 bg-[rgba(217,119,6,0.1)] text-warning";
      default:
        return "border-brand/20 bg-[rgba(47,107,255,0.1)] text-brand";
    }
  }, [toast.variant]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast-enter pointer-events-auto relative overflow-hidden rounded-[22px] border shadow-[0_22px_50px_rgba(23,32,51,0.14)] backdrop-blur-xl ${toneClassName}`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 ring-1 ring-current/10">
          <div className="h-2.5 w-2.5 rounded-full bg-current" />
        </div>
        <p className="flex-1 pr-2 pt-1 text-sm font-semibold leading-6">
          {toast.title}
        </p>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="mt-1 rounded-full p-1 text-current/60 transition hover:bg-white/50 hover:text-current"
          aria-label="Dismiss notification"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="toast-progress absolute inset-x-0 bottom-0 h-1 bg-current/15">
        <div className="toast-progress-bar h-full bg-current/70" />
      </div>
    </div>
  );
}
