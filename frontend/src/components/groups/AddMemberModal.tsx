import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { ModalPortal } from '../ui/ModalPortal';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emails: string[]) => Promise<void>;
}

export function AddMemberModal({ isOpen, onClose, onSubmit }: AddMemberModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      const finalEmails = [...emails];
      const trimmedInput = emailInput.trim().replace(/,/g, '');
      if (trimmedInput && !finalEmails.includes(trimmedInput)) {
        finalEmails.push(trimmedInput);
      }

      if (finalEmails.length === 0) return;

      await onSubmit(finalEmails);
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

  const addEmail = () => {
    const trimmed = emailInput.trim().replace(/,/g, '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (trimmed && emailRegex.test(trimmed) && !emails.includes(trimmed)) {
      setEmails(prev => [...prev, trimmed]);
      setEmailInput('');
    } else if (trimmed && !emailRegex.test(trimmed)) {
      // Don't add if invalid, but maybe keep input or clear? 
      // User said "check and allow only emails", so we block it.
      // I'll keep the text but maybe a small visual hint is better.
      // For now just don't add.
    } else {
      setEmailInput('');
    }
  };

  const removeLastEmail = () => {
    setEmails(prev => prev.slice(0, -1));
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newEmails = pasted.split(/[\s,]+/)
      .map(em => em.trim())
      .filter(em => em && emailRegex.test(em) && !emails.includes(em));
    if (newEmails.length > 0) {
      setEmails(prev => [...prev, ...newEmails]);
    }
  };

  return (
    <ModalPortal>
      <div 
        className="bg-white dark:bg-black rounded-sharp border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Add Friends to Group</h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sharp border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="emails" className="block text-xs font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
                Friend's Email Addresses
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
                  autoFocus
                  placeholder={emails.length === 0 ? "friend@example.com" : ""}
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  onBlur={addEmail}
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm font-bold"
                  disabled={isLoading}
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-black">Press Space, Comma, or Enter to add</p>
            </div>
          </div>
          
          <div className="mt-8 flex items-stretch gap-3">
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
              disabled={(emails.length === 0 && !emailInput.trim()) || isLoading}
              isLoading={isLoading}
            >
              Add Friends
            </Button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
