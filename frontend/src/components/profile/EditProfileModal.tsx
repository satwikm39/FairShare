import React, { useState } from 'react';
import { X, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { ModalPortal } from '../ui/ModalPortal';
import { Input } from '../ui/Input';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { currentUser, refreshUserData } = useAuth();
  const [name, setName] = useState(currentUser?.name || currentUser?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.patch('/users/me', { name });
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
            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Edit Profile</h2>
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
              className="w-full"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This name will be visible to everyone in groups and bills.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-sharp text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
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
              disabled={isLoading || name === (currentUser?.name || currentUser?.displayName)}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
