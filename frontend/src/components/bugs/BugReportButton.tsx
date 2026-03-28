import { useState } from 'react';
import { Bug } from 'lucide-react';
import { BugReportModal } from './BugReportModal';
import { cn } from '../../lib/utils';

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className={cn(
          "fixed bottom-6 right-6 z-[90] group",
          "animate-in fade-in slide-in-from-bottom-6 duration-700 delay-1000 fill-mode-both"
        )}
      >
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "p-3 rounded-full shadow-lg transition-all duration-300 transform",
            "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-110",
            "flex items-center gap-2 px-4 group-hover:pr-4"
          )}
        >
          <Bug className="w-5 h-5 animate-pulse" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 font-medium text-sm">
            Report Bug
          </span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
        </button>
      </div>

      <BugReportModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
