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
  const baseStyles = "relative inline-flex items-center justify-center font-bold rounded-sharp border transition-all duration-150 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3";
  
  const variants = {
    primary: "bg-brand-500 border-brand-500 hover:bg-brand-600 hover:border-brand-600 text-zinc-950 focus-visible:ring-brand-500",
    secondary: "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700",
    outline: "bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-200 focus-visible:ring-zinc-300",
    ghost: "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white focus-visible:ring-zinc-200",
    danger: "bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600 text-white focus-visible:ring-red-500",
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
