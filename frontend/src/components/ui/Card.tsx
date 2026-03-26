import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  noPadding?: boolean;
  allowOverflow?: boolean;
}

export function Card({ children, className, noPadding = false, allowOverflow = false, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800",
        !allowOverflow && "overflow-hidden",
        !noPadding && "p-6 md:p-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
