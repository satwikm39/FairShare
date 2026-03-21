import { useState, useEffect } from 'react';
import { X, Calendar, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import type { GroupMemberResponse } from '../../types';

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, date: string, participantUserIds: number[]) => Promise<void>;
  members: GroupMemberResponse[];
  currentUserId: number;
}

export function CreateBillModal({ isOpen, onClose, onSubmit, members, currentUserId }: CreateBillModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set([currentUserId]));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set([currentUserId]));
    }
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const toggleMember = (userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size > 1) next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date || selectedIds.size === 0) return;

    setIsLoading(true);
    try {
      await onSubmit(name.trim(), date, Array.from(selectedIds));
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Create New Bill</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label htmlFor="bill_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bill Name
              </label>
              <input
                id="bill_name"
                type="text"
                autoFocus
                placeholder="e.g. Saturday Dinner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="bill_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <div className="relative">
                <input
                  id="bill_date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        (e.target as HTMLInputElement).showPicker();
                      }
                    } catch {}
                  }}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all cursor-pointer"
                  disabled={isLoading}
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Split with
                </label>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Select who is part of this bill (at least one)
              </p>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-3 space-y-2 max-h-40 overflow-y-auto">
                {members.map((m) => (
                  <label
                    key={m.user_id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg px-3 py-2 -mx-1 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.user_id)}
                      onChange={() => toggleMember(m.user_id)}
                      disabled={isLoading}
                      className="rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500/20"
                    />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {m.user.name}
                    </span>
                  </label>
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
              disabled={!name.trim() || !date || selectedIds.size === 0 || isLoading}
              isLoading={isLoading}
            >
              Create Bill
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
