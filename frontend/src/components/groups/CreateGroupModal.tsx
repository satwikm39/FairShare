import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { ModalPortal } from '../ui/ModalPortal';
import { cn, currencies } from '../../lib/utils';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, currency: string, emails: string[]) => Promise<void>;
}

export function CreateGroupModal({ isOpen, onClose, onSubmit }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      const finalEmails = [...emails];
      const trimmedInput = emailInput.trim().replace(/,/g, '');
      if (trimmedInput && !finalEmails.includes(trimmedInput)) {
        finalEmails.push(trimmedInput);
      }

      await onSubmit(name.trim(), currency, finalEmails);
      setName('');
      setEmails([]);
      setEmailInput('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addEmail();
    } else if (e.key === 'Backspace' && !emailInput) {
      removeLastEmail();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const newEmails = pasted.split(/[\s,]+/).map(em => em.trim()).filter(em => em && !emails.includes(em));
    if (newEmails.length > 0) {
      setEmails(prev => [...prev, ...newEmails]);
    }
  };

  const addEmail = () => {
    const trimmed = emailInput.trim().replace(/,/g, '');
    if (trimmed && !emails.includes(trimmed)) {
      setEmails(prev => [...prev, trimmed]);
    }
    setEmailInput('');
  };

  const removeLastEmail = () => {
    setEmails(prev => prev.slice(0, -1));
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  return (
    <ModalPortal>
      <div 
        className="bg-white dark:bg-black rounded-sharp border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Create New Group</h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sharp transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-zinc-700 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                Group Name
              </label>
              <input
                id="name"
                type="text"
                autoFocus
                placeholder="e.g. Miami Trip 2026"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="emails" className="block text-sm font-bold text-zinc-700 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                Invite Members (Optional)
              </label>
              <div 
                className="w-full px-4 py-3 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus-within:border-brand-500 dark:focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all flex flex-wrap gap-2 items-center min-h-[50px] cursor-text"
                onClick={() => document.getElementById('emails')?.focus()}
              >
                {emails.map(email => (
                  <span key={email} className="flex items-center gap-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-2 py-1 rounded-sharp text-xs font-bold border border-brand-500/20 animate-in zoom-in duration-200">
                    {email}
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); removeEmail(email); }}
                      className="hover:text-brand-800 dark:hover:text-brand-200 transition-colors"
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  id="emails"
                  type="text"
                  placeholder={emails.length === 0 ? "friend@example.com, another@example.com" : ""}
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  onBlur={addEmail}
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm"
                  disabled={isLoading}
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-black">Press Space, Comma, or Enter to add</p>
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
                      "@container flex items-center justify-between px-4 py-3 text-left rounded-sharp border-2 transition-all duration-300 group",
                      currency === curr.code
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 shadow-md ring-4 ring-brand-500/10"
                        : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                    disabled={isLoading}
                  >
                    <div className="flex min-w-0 flex-1 flex-col items-start text-left pr-1">
                      <span className="w-full text-left text-[clamp(0.5rem,calc(0.35rem+2.8cqi),0.625rem)] font-bold uppercase leading-tight tracking-wide text-slate-400 dark:text-slate-500 group-hover:text-brand-500 transition-colors">
                        {curr.label}
                      </span>
                      <span className="w-full text-left text-sm font-black uppercase tracking-tight">
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
    </ModalPortal>
  );
}
