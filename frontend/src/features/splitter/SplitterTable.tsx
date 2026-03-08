import { Card } from '../../components/ui/Card';
import { Minus, Plus, Loader2, Divide } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import type { Bill, Group } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SplitterTableProps {
  bill: Bill;
  group?: Group | null;
  onUpdateShare: (itemId: number, userId: number, increment: number) => void;
  onSplitAllEqually?: (userIds: number[]) => void;
}

export function SplitterTable({ bill, group, onUpdateShare, onSplitAllEqually }: SplitterTableProps) {
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
  // Default tax/tip placeholders until backend supports it
  const totalTax = bill.total_tax > 0 ? bill.total_tax : totalBillSubtotal * 0.08; 
  const totalTip = totalBillSubtotal * 0.20; // Placeholder
  const totalFees = totalTax + totalTip;
  const billGrandTotal = totalBillSubtotal + totalFees;

  if (bill.items.length === 0) {
    return (
      <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-lg text-center p-12 text-slate-500 dark:text-slate-400">
        No items on this bill yet. Upload a receipt to get started.
      </Card>
    );
  }

  if (!group) {
    return (
      <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-lg text-center p-12 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-500" />
        Loading group members...
      </Card>
    );
  }

  const { currentUser } = useAuth();
  
  let users = group.members?.map(m => m.user) || [];
  // Fallback so the table always has at least one column (specifically for groups created before the backend fix)
  if (users.length === 0) {
    users = [
      { id: 999, name: currentUser?.displayName || 'You', email: currentUser?.email || '' }
    ];
  }

  return (
    <Card className="overflow-x-auto border-slate-200/60 dark:border-slate-700/50 shadow-lg" noPadding>
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 rounded-t-[2rem]">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Bill Items</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Edit shares or use auto-split.</p>
        </div>
        {onSplitAllEqually && (
          <Button 
            variant="secondary" 
            onClick={() => onSplitAllEqually(users.map(u => u.id))} 
            className="gap-2 shadow-sm text-xs h-9 px-4"
          >
            <Divide className="w-4 h-4 text-brand-500 dark:text-brand-400" />
            Equally Split All
          </Button>
        )}
      </div>
      <table className="w-full text-left border-collapse min-w-[650px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <th className="p-5 w-1/3 border-r border-slate-200/50 dark:border-slate-700/50">Item Name</th>
            <th className="p-5 text-right w-1/6 border-r border-slate-200/50 dark:border-slate-700/50">Unit Cost</th>
            {users.map((user, idx) => (
              <th key={user.id} className={cn("p-5 text-center", idx !== users.length - 1 && "border-r border-slate-200/50 dark:border-slate-700/50")}>
                <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center justify-center font-extrabold ring-2 ring-transparent group-hover:ring-brand-200 dark:group-hover:ring-brand-700 transition-all shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user.name.split(' ')[0]}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {bill.items.map(item => {
            const totalItemShares = item.shares.reduce((sum, share) => sum + share.share_count, 0);
            const isZeroShares = totalItemShares === 0;
            return (
              <tr key={item.id} className={cn("transition-colors group", isZeroShares ? "bg-red-50/80 dark:bg-red-900/20 hover:bg-red-100/80 dark:hover:bg-red-900/30 ring-1 ring-inset ring-red-200 dark:ring-red-800/60" : "hover:bg-slate-50/50 dark:hover:bg-slate-700/30")}>
                <td className="p-5 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200/50 dark:border-slate-700/50">{item.item_name}</td>
                <td className="p-5 text-right font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200/50 dark:border-slate-700/50">${item.unit_cost.toFixed(2)}</td>
                {users.map((user, idx) => {
                  const userShareObj = item.shares.find(s => s.user_id === user.id);
                  const currentShares = userShareObj ? userShareObj.share_count : 0;
                  
                  return (
                    <td key={user.id} className={cn("p-5", idx !== users.length - 1 && "border-r border-slate-200/50 dark:border-slate-700/50")}>
                      <div className="flex items-center justify-center gap-2.5">
                        <button 
                          onClick={() => onUpdateShare(item.id, user.id, currentShares - 1)}
                          className={cn("p-1.5 rounded-full transition-all active:scale-95", currentShares > 0 ? 'bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-default opacity-50')}
                          disabled={currentShares === 0}
                        >
                         <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center font-extrabold text-slate-800 dark:text-slate-200 text-sm">{currentShares}</span>
                      <button 
                         onClick={() => onUpdateShare(item.id, user.id, currentShares + 1)}
                        className="p-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 hover:bg-brand-200 dark:hover:bg-brand-800/50 text-brand-700 dark:text-brand-400 transition-all shadow-sm active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-200/80 dark:border-slate-700">
          <tr>
            <td className="p-5 text-right font-extrabold text-slate-700 dark:text-slate-300 rounded-bl-[2rem] border-r border-slate-200/50 dark:border-slate-700/50">Subtotal</td>
            <td className="p-5 text-right font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200/50 dark:border-slate-700/50">${totalBillSubtotal.toFixed(2)}</td>
            {users.map((user, idx) => (
              <td key={user.id} className={cn("p-5 text-center font-extrabold text-slate-800 dark:text-slate-100", idx !== users.length - 1 && "border-r border-slate-200/50 dark:border-slate-700/50")}>
                ${getSubtotalForUser(user.id).toFixed(2)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-5 py-3 text-right font-bold text-slate-500 dark:text-slate-400 text-sm border-r border-slate-200/50 dark:border-slate-700/50">Tax (8%) + Tip (20%)</td>
            <td className="px-5 py-3 text-right font-bold text-slate-500 dark:text-slate-400 text-sm border-r border-slate-200/50 dark:border-slate-700/50">+${totalFees.toFixed(2)}</td>
            {users.map((user, idx) => {
              const userSub = getSubtotalForUser(user.id);
              const userShareOfFees = totalBillSubtotal > 0 ? (userSub / totalBillSubtotal) * totalFees : 0;
              return (
                <td key={user.id} className={cn("px-5 py-3 text-center font-bold text-slate-500 dark:text-slate-400 text-sm", idx !== users.length - 1 && "border-r border-slate-200/50 dark:border-slate-700/50")}>
                   +${userShareOfFees.toFixed(2)}
                </td>
              );
            })}
          </tr>
          <tr className="bg-brand-50/50 dark:bg-brand-900/10">
            <td className="p-5 text-right font-black text-brand-900 dark:text-brand-300 border-t border-brand-100 dark:border-brand-900/50 rounded-bl-[2rem] border-r border-brand-100/50 dark:border-brand-900/30">Grand Total</td>
            <td className="p-5 text-right font-black text-brand-700 dark:text-brand-400 text-xl border-t border-brand-100 dark:border-brand-900/50 border-r border-brand-100/50 dark:border-brand-900/30">${billGrandTotal.toFixed(2)}</td>
            {users.map((user, idx) => {
              const userSub = getSubtotalForUser(user.id);
              const userShareOfFees = totalBillSubtotal > 0 ? (userSub / totalBillSubtotal) * totalFees : 0;
              return (
                <td key={user.id} className={cn("p-5 text-center font-black text-brand-700 dark:text-brand-400 text-xl border-t border-brand-100 dark:border-brand-900/50", idx !== users.length - 1 && "border-r border-brand-100/50 dark:border-brand-900/30")}>
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
