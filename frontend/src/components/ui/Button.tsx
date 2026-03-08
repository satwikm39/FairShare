import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  children,
  fullWidth = false,
  isLoading = false,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3";
  
  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30 focus-visible:ring-brand-500",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-sm focus-visible:ring-slate-300",
    outline: "border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm focus-visible:ring-slate-300",
    ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-200",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 focus-visible:ring-red-500",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], fullWidth ? "w-full" : "", className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      ) : null}
      <span className={cn(isLoading ? 'opacity-0' : 'opacity-100', 'flex items-center gap-2')}>
        {children}
      </span>
    </button>
  );
}
