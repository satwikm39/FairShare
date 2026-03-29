import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { ModalPortal } from '../ui/ModalPortal';
import type { GroupMemberResponse } from '../../types';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fromUserId: number, toUserId: number, amount: number) => Promise<void>;
  members: GroupMemberResponse[];
  currentUserId: number;
  currencySymbol: string;
}

export function SettleUpModal({ isOpen, onClose, onSubmit, members, currentUserId, currencySymbol }: SettleUpModalProps) {
  const [fromUserId, setFromUserId] = useState<number>(currentUserId);
  const [toUserId, setToUserId] = useState<number>(members.find(m => m.user_id !== currentUserId)?.user_id || 0);
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFromUserId(currentUserId);
      setToUserId(members.find(m => m.user_id !== currentUserId)?.user_id || 0);
      setAmount('');
    }
  }, [isOpen, currentUserId, members]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || fromUserId === toUserId || !fromUserId || !toUserId) return;

    setIsLoading(true);
    try {
      await onSubmit(fromUserId, toUserId, numAmount);
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
        className="bg-white dark:bg-black rounded-sharp border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Record a Payment</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sharp border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1">
          <div className="space-y-6">
            
            {/* Who is paying whom */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
                  Who paid
                </label>
                <select
                  value={fromUserId}
                  onChange={(e) => setFromUserId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 appearance-none cursor-pointer font-bold text-sm uppercase tracking-tight"
                  disabled={isLoading}
                >
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-6 shrink-0 text-zinc-300 dark:text-zinc-700">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
                  Who received
                </label>
                <select
                  value={toUserId}
                  onChange={(e) => setToUserId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 appearance-none cursor-pointer font-bold text-sm uppercase tracking-tight"
                  disabled={isLoading}
                >
                  <option value={0} disabled>Select...</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error display for identical users */}
            {fromUserId === toUserId && fromUserId !== 0 && (
              <p className="text-sm font-medium text-rose-500 mt-[-10px]">
                A person cannot pay themselves.
              </p>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
                Amount
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black italic">
                  {currencySymbol}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  autoFocus
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700 text-2xl font-black tracking-tighter"
                  disabled={isLoading}
                />
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
              disabled={!amount || parseFloat(amount) <= 0 || fromUserId === toUserId || isLoading}
              isLoading={isLoading}
            >
              Save Payment
            </Button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
