import { Card } from '../../components/ui/Card';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Bill } from '../../types';

interface User {
  id: number;
  name: string;
  avatar: string;
}

// Still using mock users until Group Management API is built
const MOCK_USERS: User[] = [
  { id: 1, name: 'Alice', avatar: 'A' },
  { id: 2, name: 'Bob', avatar: 'B' },
  { id: 3, name: 'Charlie', avatar: 'C' },
];

interface SplitterTableProps {
  bill: Bill;
  onUpdateShare: (itemId: number, userId: number, increment: number) => Promise<void>;
}

export function SplitterTable({ bill, onUpdateShare }: SplitterTableProps) {
  const getSubtotalForUser = (userId: number) => {
    let subtotal = 0;
    bill.items.forEach(item => {
      // Calculate total shares for this item across all users
      const totalShares = item.shares.reduce((sum, share) => sum + share.share_count, 0);
      if (totalShares > 0) {
        // Find this specific user's shares
        const userShareObj = item.shares.find(s => s.user_id === userId);
        const userShares = userShareObj ? userShareObj.share_count : 0;
        
        subtotal += (item.unit_cost / totalShares) * userShares;
      }
    });
    return subtotal;
  };

  const totalBillSubtotal = bill.items.reduce((sum, item) => sum + item.unit_cost, 0);
  const totalTax = totalBillSubtotal * 0.08; // Placeholder: use bill.total_tax when backend supports it
  const totalTip = totalBillSubtotal * 0.20; // Placeholder
  const totalFees = totalTax + totalTip;

  if (bill.items.length === 0) {
    return (
      <Card className="border-slate-200/60 shadow-lg text-center p-12 text-slate-500">
        No items on this bill yet. Upload a receipt to get started.
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto border-slate-200/60 shadow-lg" noPadding>
      <table className="w-full text-left border-collapse min-w-[650px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200/80 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <th className="p-5 w-1/3 rounded-tl-[2rem]">Item Name</th>
            <th className="p-5 text-right w-1/6">Unit Cost</th>
            {MOCK_USERS.map(user => (
              <th key={user.id} className="p-5 text-center">
                <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-extrabold ring-2 ring-transparent group-hover:ring-brand-200 transition-all shadow-sm">
                    {user.avatar}
                  </div>
                  <span className="text-xs font-semibold">{user.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bill.items.map(item => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="p-5 font-semibold text-slate-800">{item.item_name}</td>
              <td className="p-5 text-right font-bold text-slate-700">${item.unit_cost.toFixed(2)}</td>
              {MOCK_USERS.map(user => {
                const userShareObj = item.shares.find(s => s.user_id === user.id);
                const currentShares = userShareObj ? userShareObj.share_count : 0;
                
                return (
                  <td key={user.id} className="p-5">
                    <div className="flex items-center justify-center gap-2.5">
                      <button 
                        onClick={() => onUpdateShare(item.id, user.id, currentShares - 1)}
                        className={cn("p-1.5 rounded-full transition-all active:scale-95", currentShares > 0 ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm' : 'bg-slate-100 text-slate-300 cursor-default opacity-50')}
                        disabled={currentShares === 0}
                      >
                         <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center font-extrabold text-slate-800 text-sm">{currentShares}</span>
                      <button 
                         onClick={() => onUpdateShare(item.id, user.id, currentShares + 1)}
                        className="p-1.5 rounded-full bg-brand-100 hover:bg-brand-200 text-brand-700 transition-all shadow-sm active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 border-t-2 border-slate-200/80">
          <tr>
            <td colSpan={2} className="p-5 text-right font-extrabold text-slate-700 rounded-bl-[2rem]">Subtotal</td>
            {MOCK_USERS.map(user => (
              <td key={user.id} className="p-5 text-center font-extrabold text-slate-800">
                ${getSubtotalForUser(user.id).toFixed(2)}
              </td>
            ))}
          </tr>
          <tr>
            <td colSpan={2} className="px-5 py-3 text-right font-bold text-slate-500 text-sm">Tax (8%) + Tip (20%)</td>
            {MOCK_USERS.map(user => {
              const userSub = getSubtotalForUser(user.id);
              const userShareOfFees = totalBillSubtotal > 0 ? (userSub / totalBillSubtotal) * totalFees : 0;
              return (
                <td key={user.id} className="px-5 py-3 text-center font-bold text-slate-500 text-sm">
                   +${userShareOfFees.toFixed(2)}
                </td>
              );
            })}
          </tr>
          <tr className="bg-brand-50/50">
            <td colSpan={2} className="p-5 text-right font-black text-brand-900 border-t border-brand-100 rounded-bl-[2rem]">Grand Total</td>
            {MOCK_USERS.map(user => {
              const userSub = getSubtotalForUser(user.id);
              const userShareOfFees = totalBillSubtotal > 0 ? (userSub / totalBillSubtotal) * totalFees : 0;
              return (
                <td key={user.id} className="p-5 text-center font-black text-brand-700 text-xl border-t border-brand-100">
                  ${(userSub + userShareOfFees).toFixed(2)}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}
