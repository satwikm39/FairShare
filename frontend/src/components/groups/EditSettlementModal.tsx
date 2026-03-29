import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { ModalPortal } from '../ui/ModalPortal';
import type { GroupMemberResponse, Settlement } from '../../types';

interface EditSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: { from_user_id?: number; to_user_id?: number; amount?: number; date?: string }) => Promise<void>;
  settlement: Settlement | null;
  members: GroupMemberResponse[];
  currencySymbol: string;
}

export function EditSettlementModal({ isOpen, onClose, onSubmit, settlement, members, currencySymbol }: EditSettlementModalProps) {
  const [fromUserId, setFromUserId] = useState<number>(0);
  const [toUserId, setToUserId] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && settlement) {
      setFromUserId(settlement.from_user_id);
      setToUserId(settlement.to_user_id);
      setAmount(settlement.amount.toString());
      // Format date for input: YYYY-MM-DD
      const d = new Date(settlement.date);
      const formattedDate = d.toISOString().split('T')[0];
      setDate(formattedDate);
    }
  }, [isOpen, settlement]);

  if (!isOpen || !settlement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || fromUserId === toUserId || !fromUserId || !toUserId) return;

    setIsLoading(true);
    try {
      await onSubmit(settlement.id, {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: numAmount,
        date: new Date(date).toISOString()
      });
      onClose();
    } catch (error) {
      console.error('Failed to update settlement:', error);
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
          <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Edit Payment</h2>
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
                  Payer
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
                  Recipient
                </label>
                <select
                  value={toUserId}
                  onChange={(e) => setToUserId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 appearance-none cursor-pointer font-bold text-sm uppercase tracking-tight"
                  disabled={isLoading}
                >
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error display for identical users */}
            {fromUserId === toUserId && (
              <p className="text-sm font-medium text-rose-500 mt-[-10px]">
                A person cannot pay themselves.
              </p>
            )}

            {/* Amount and Date row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold italic text-sm">
                    {currencySymbol}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-brand-500 outline-none transition-all font-bold text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-brand-500 outline-none transition-all font-bold text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

          </div>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-sharp h-10"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 rounded-sharp h-10"
              disabled={!amount || parseFloat(amount) <= 0 || fromUserId === toUserId || isLoading}
              isLoading={isLoading}
            >
              Update Payment
            </Button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
