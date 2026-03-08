import { useState } from 'react';
import { Card } from '../ui/Card';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BillItem {
  id: string;
  name: string;
  price: number;
}

interface User {
  id: string;
  name: string;
  avatar: string;
}

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice', avatar: 'A' },
  { id: 'u2', name: 'Bob', avatar: 'B' },
  { id: 'u3', name: 'Charlie', avatar: 'C' },
];

const MOCK_ITEMS: BillItem[] = [
  { id: 'i1', name: 'Appetizer Platter', price: 18.50 },
  { id: 'i2', name: 'Steak Frites', price: 42.00 },
  { id: 'i3', name: 'House Wine (Bottle)', price: 35.00 },
];

export function SplitterTable() {
  // itemShares: { [itemId]: { [userId]: number } }
  const [itemShares, setItemShares] = useState<Record<string, Record<string, number>>>({});

  const updateShare = (itemId: string, userId: string, increment: number) => {
    setItemShares(prev => {
      const currentShares = prev[itemId]?.[userId] || 0;
      const newShares = Math.max(0, currentShares + increment);
      return {
        ...prev,
        [itemId]: {
          ...(prev[itemId] || {}),
          [userId]: newShares
        }
      };
    });
  };

  const getSubtotalForUser = (userId: string) => {
    let subtotal = 0;
    MOCK_ITEMS.forEach(item => {
      const sharesMap = itemShares[item.id] || {};
      const totalShares = Object.values(sharesMap).reduce((a, b) => a + b, 0);
      if (totalShares > 0) {
        const userShares = sharesMap[userId] || 0;
        subtotal += (item.price / totalShares) * userShares;
      }
    });
    return subtotal;
  };

  const totalBillSubtotal = MOCK_ITEMS.reduce((sum, item) => sum + item.price, 0);
  const totalTax = totalBillSubtotal * 0.08; // 8% mock tax
  const totalTip = totalBillSubtotal * 0.20; // 20% mock tip
  const totalFees = totalTax + totalTip;

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
          {MOCK_ITEMS.map(item => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="p-5 font-semibold text-slate-800">{item.name}</td>
              <td className="p-5 text-right font-bold text-slate-700">${item.price.toFixed(2)}</td>
              {MOCK_USERS.map(user => {
                const shares = itemShares[item.id]?.[user.id] || 0;
                return (
                  <td key={user.id} className="p-5">
                    <div className="flex items-center justify-center gap-2.5">
                      <button 
                        onClick={() => updateShare(item.id, user.id, -1)}
                        className={cn("p-1.5 rounded-full transition-all active:scale-95", shares > 0 ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm' : 'bg-slate-100 text-slate-300 cursor-default opacity-50')}
                        disabled={shares === 0}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center font-extrabold text-slate-800 text-sm">{shares}</span>
                      <button 
                        onClick={() => updateShare(item.id, user.id, 1)}
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
