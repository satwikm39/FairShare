import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Renders modal overlay at document.body so it covers the full viewport (including fixed navbar),
 * avoiding clipping when an ancestor uses transform (e.g. page enter animations).
 */
export function ModalPortal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center p-4',
        'bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200',
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}
