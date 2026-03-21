import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn, currencies } from '../../lib/utils';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, currency: string) => Promise<void>;
}

export function CreateGroupModal({ isOpen, onClose, onSubmit }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      await onSubmit(name.trim(), currency);
      setName('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create New Group</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Group Name
              </label>
              <input
                id="name"
                type="text"
                autoFocus
                placeholder="e.g. Miami Trip 2026"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Currency
              </label>
              <div className="grid grid-cols-2 gap-3">
                {currencies.map(curr => (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => setCurrency(curr.code)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-300 group",
                      currency === curr.code
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 shadow-md ring-4 ring-brand-500/10"
                        : "border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                    disabled={isLoading}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors">
                        {curr.label}
                      </span>
                      <span className="text-sm font-black uppercase tracking-tight">
                        {curr.code}
                      </span>
                    </div>
                    <span className={cn(
                      "text-3xl font-black shrink-0 transition-transform group-hover:scale-110",
                      currency === curr.code ? "text-brand-600 dark:text-brand-400" : "text-slate-300 dark:text-slate-600"
                    )}>
                      {curr.symbol}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!name.trim() || isLoading}
              isLoading={isLoading}
            >
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
