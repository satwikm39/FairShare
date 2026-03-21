import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastVariant = 'error' | 'success';

interface ToastState {
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'error') => {
    setToast({ message, variant });
    window.setTimeout(() => setToast(null), AUTO_DISMISS_MS);
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 z-[100] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-200',
            'rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm',
            toast.variant === 'error'
              ? 'border-red-200 bg-red-50/95 text-red-900 dark:border-red-900/50 dark:bg-red-950/90 dark:text-red-100'
              : 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/90 dark:text-emerald-100'
          )}
          role="alert"
        >
          {toast.variant === 'error' ? (
            <AlertCircle className="mr-3 mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="mr-3 mt-0.5 h-5 w-5 shrink-0" />
          )}
          <p className="flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={dismiss}
            className="ml-2 rounded-lg p-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
