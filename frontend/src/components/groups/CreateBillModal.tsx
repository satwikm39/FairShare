import { useState, useEffect } from 'react';
import { X, Calendar, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { ModalPortal } from '../ui/ModalPortal';
import type { GroupMemberResponse } from '../../types';

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, date: string, participantUserIds: number[]) => Promise<void>;
  members: GroupMemberResponse[];
}

export function CreateBillModal({ isOpen, onClose, onSubmit, members }: CreateBillModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(members.map(m => m.user_id)));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(members.map(m => m.user_id)));
    }
  }, [isOpen, members]);

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
    <ModalPortal>
      <div
        className="bg-white dark:bg-black rounded-sharp border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Create New Bill</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sharp border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label htmlFor="bill_name" className="block text-xs font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
                Bill Name
              </label>
              <input
                id="bill_name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-bold"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="bill_date" className="block text-xs font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
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
                  className="w-full px-4 py-3 pl-11 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all cursor-pointer font-bold"
                  disabled={isLoading}
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-500" />
                <label className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                  Split with
                </label>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mb-3 font-bold uppercase tracking-wider">
                Select participants (at least one)
              </p>
              <div className="rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3 space-y-2 max-h-40 overflow-y-auto">
                {members.map((m) => (
                  <label
                    key={m.user_id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-sharp px-3 py-2 -mx-1 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.user_id)}
                      onChange={() => toggleMember(m.user_id)}
                      disabled={isLoading}
                      className="rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500/20"
                    />
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">
                      {m.user.name}
                    </span>
                  </label>
                ))}
              </div>
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
              disabled={!name.trim() || !date || selectedIds.size === 0 || isLoading}
              isLoading={isLoading}
            >
              Create Bill
            </Button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
