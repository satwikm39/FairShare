import React, { useState } from 'react';
import { X, User, Loader2, Edit3, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/userService';
import { ModalPortal } from '../ui/ModalPortal';
import { Input } from '../ui/Input';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export function EditProfileModal({ isOpen, onClose, onLogout }: EditProfileModalProps) {
  const { currentUser, refreshUserData } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(currentUser?.name || currentUser?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isChanged = name !== (currentUser?.name || currentUser?.displayName);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await userService.updateProfile({ name });
      await refreshUserData();
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalPortal className="bg-slate-900/40 dark:bg-slate-900/80">
      <div 
        className="bg-white dark:bg-black rounded-sharp border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sharp bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-500/10">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Profile Setting</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sharp transition-colors disabled:opacity-50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider">
              Display Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your display name"
              required
              disabled={isLoading}
              suffix={
                isChanged ? (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="text-[10px] font-black text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-all uppercase tracking-widest px-2.5 py-1.5 rounded-sharp border border-brand-500/20 bg-brand-500/5 hover:bg-brand-500/10 flex items-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                  </button>
                ) : (
                  <Edit3 className="w-4 h-4 text-zinc-400" />
                )
              }
              className="w-full pr-16"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This name will be visible to everyone in groups and bills.
            </p>
          </div>

          <div className="pt-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider mb-3 block">
              Appearance
            </label>
            <div 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sharp cursor-pointer group hover:border-brand-500 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="text-zinc-500 group-hover:text-brand-500 transition-colors">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <div className="w-10 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full relative transition-colors group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700">
                <div className={`absolute top-1 w-4 h-4 bg-white dark:bg-zinc-400 rounded-full shadow-sm transition-all duration-300 ${theme === 'dark' ? 'left-5 bg-brand-500 dark:bg-brand-500' : 'left-1'}`} />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-sharp text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          


          {onLogout && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-center">
              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-sharp"
              >
                Sign Out of Account
              </button>
            </div>
          )}
        </form>
      </div>
    </ModalPortal>
  );
}
