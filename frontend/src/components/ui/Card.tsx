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
        "bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700/50",
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
