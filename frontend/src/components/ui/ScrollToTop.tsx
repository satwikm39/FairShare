import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the top cordinate to 0
  // make scrolling smooth
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div className={cn(
      "fixed bottom-24 right-8 z-40 transition-all duration-300 transform",
      isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-90 pointer-events-none"
    )}>
      <button
        type="button"
        onClick={scrollToTop}
        className="group relative flex h-12 w-12 items-center justify-center bg-brand-500 text-white shadow-2xl shadow-brand-500/20 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 rounded-sharp transition-all duration-200 active:scale-95"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6 transition-transform duration-300 group-hover:-translate-y-1" />
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-sharp bg-brand-400 opacity-0 blur-xl transition-opacity group-hover:opacity-40" />
      </button>
    </div>
  );
}
