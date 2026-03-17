import React, { useState } from 'react';
import { X, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Profile</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
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
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-sm text-red-600 dark:text-red-400">
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
    </div>
  );
}
