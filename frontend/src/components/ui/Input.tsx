import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-2">
        {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-base rounded-sharp block p-3.5 outline-none transition-all duration-200",
              "focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              icon ? 'pl-11' : '',
              error ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/30 dark:focus:bg-red-900/50 focus:bg-white dark:focus:border-red-500' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
