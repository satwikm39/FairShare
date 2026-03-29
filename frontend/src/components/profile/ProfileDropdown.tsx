import React, { useState, useEffect, useRef } from 'react';
import { User, Loader2, Edit3, Sun, Moon, LogOut, Mail, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/userService';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { isDemoMode } from '../../config/demo';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  isInline?: boolean;
}

export function ProfileDropdown({ isOpen, onClose, onLogout, isInline = false }: ProfileDropdownProps) {
  const { currentUser, refreshUserData } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(currentUser?.name || currentUser?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const demoActive = isDemoMode();

  const isChanged = name !== (currentUser?.name || currentUser?.displayName);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen && !isInline) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isInline]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await userService.updateProfile({ name });
      await refreshUserData();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className={cn(
        "bg-white dark:bg-black rounded-sharp border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[60]",
        isInline 
          ? "relative w-full shadow-sm mt-2 mb-4" 
          : "absolute top-12 right-0 w-80 shadow-2xl"
      )}
    >
      {/* Header / Current User */}
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sharp bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-500/10">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover rounded-sharp" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text- zinc-900 dark:text-white truncate uppercase tracking-tight">
              {currentUser?.name || currentUser?.displayName || 'User'}
            </p>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 truncate uppercase tracking-widest flex items-center gap-1">
              <Mail className="w-2.5 h-2.5" />
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Name Input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            Display Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            required
            disabled={isLoading}
            suffix={
              isChanged ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="text-[9px] font-black text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-all uppercase tracking-widest px-2 py-1 rounded-sharp border border-brand-500/20 bg-brand-500/5 hover:bg-brand-500/10 flex items-center gap-1"
                >
                  {isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Save'}
                </button>
              ) : (
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
              )
            }
            className="w-full pr-12 text-xs p-2"
          />
        </form>

        {/* Theme Selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            Appearance
          </label>
          <div className="flex">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-l-sharp text-[10px] font-black uppercase tracking-widest transition-all duration-200 border border-r-0",
                theme === 'light'
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent z-10"
                  : "bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 border-b-2 border-b-zinc-300 dark:border-b-zinc-700 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              <Sun className="w-3 h-3" />
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-r-sharp text-[10px] font-black uppercase tracking-widest transition-all duration-200 border",
                theme === 'dark'
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent z-10"
                  : "bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 border-b-2 border-b-zinc-300 dark:border-b-zinc-700 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              <Moon className="w-3 h-3" />
              Dark
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-sharp text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        {onLogout && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onLogout}
              className={cn(
                "w-full flex items-center justify-center gap-2 text-[10px] font-black transition-colors uppercase tracking-widest py-2.5 border rounded-sharp",
                demoActive 
                  ? "text-brand-600 hover:text-brand-700 border-brand-500/10 hover:bg-brand-50 dark:hover:bg-brand-900/10"
                  : "text-red-500 hover:text-red-600 border-red-500/10 hover:bg-red-50 dark:hover:bg-red-900/10"
              )}
            >
              {demoActive ? <Zap className="w-3 h-3 fill-current" /> : <LogOut className="w-3 h-3" />}
              {demoActive ? 'Exit Demo' : 'Sign Out'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
