import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Minus, Plus, Loader2, Divide, PlusCircle, X, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn, getCurrencySymbol } from '../../lib/utils';
import type { Bill, Group } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SplitterTableProps {
  bill: Bill;
  group?: Group | null;
  onUpdateShare: (itemId: number, userId: number, increment: number) => void;
  onSplitAllEqually?: (userIds: number[]) => void;
  onUpdateItemDetails?: (itemId: number, name: string, cost: number) => void;
  onUpdateTax?: (tax: number) => void;
  /** Stage multiple new rows locally; they persist on the next bill save (auto or manual). */
  onBulkAddItems?: (items: { item_name: string; unit_cost: number }[]) => void;
  onDeleteItem?: (itemId: number) => Promise<void>;
  onResetAll?: () => void;
  onRemoveUser?: (userId: number, userName: string) => void;
}

type DraftRow = { key: string; name: string; cost: string };

function newDraftRow(): DraftRow {
  return { key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: '', cost: '' };
}

export function SplitterTable({ bill, group, onUpdateShare, onSplitAllEqually, onUpdateItemDetails, onUpdateTax, onBulkAddItems, onDeleteItem, onResetAll, onRemoveUser }: SplitterTableProps) {
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  // Column resizing state (uncontrolled for performance)
  const itemNameColRef = useRef<HTMLTableCellElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !itemNameColRef.current) return;
    const newWidth = Math.max(150, startWidth.current + (e.pageX - startX.current));
    // Apply width directly to DOM for smooth resizing
    itemNameColRef.current.style.width = `${newWidth}px`;
    itemNameColRef.current.style.minWidth = `${newWidth}px`;
    itemNameColRef.current.style.maxWidth = `${newWidth}px`;
    
    // Also apply to all cells in the column to force rigid alignment
    const colCells = itemNameColRef.current.closest('table')?.querySelectorAll('.item-name-col') || [];
    colCells.forEach(cell => {
       if (cell instanceof HTMLElement) {
          cell.style.width = `${newWidth}px`;
          cell.style.minWidth = `${newWidth}px`;
          cell.style.maxWidth = `${newWidth}px`;
       }
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.pageX;
    startWidth.current = itemNameColRef.current?.offsetWidth || 250;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  const { currentUser } = useAuth();

  const openDraft = () => {
    setDraftError(null);
    setDraftOpen(true);
    setDraftRows([newDraftRow()]);
  };

  const cancelDraft = () => {
    setDraftOpen(false);
    setDraftRows([]);
    setDraftError(null);
  };

  const addDraftRow = () => {
    setDraftRows((r) => [...r, newDraftRow()]);
  };

  const removeDraftRow = (key: string) => {
    setDraftRows((r) => (r.length <= 1 ? r : r.filter((x) => x.key !== key)));
  };

  const updateDraftRow = (key: string, patch: Partial<Pick<DraftRow, 'name' | 'cost'>>) => {
    setDraftRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const submitAllDrafts = () => {
    if (!onBulkAddItems) return;
    setDraftError(null);
    const parsed: { item_name: string; unit_cost: number }[] = [];
    for (const row of draftRows) {
      const name = row.name.trim();
      const costNum = parseFloat(row.cost);
      if (!name || row.cost.trim() === '' || Number.isNaN(costNum) || costNum < 0) {
        setDraftError('Fill name and a valid cost (≥ 0) for every row, or remove empty rows.');
        return;
      }
      parsed.push({ item_name: name, unit_cost: costNum });
    }
    if (parsed.length === 0) {
      setDraftError('Add at least one item.');
      return;
    }
    onBulkAddItems(parsed);
    cancelDraft();
  };

  const handleDraftKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') cancelDraft();
  };
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
  const totalFees = bill.total_tax;
  const billGrandTotal = totalBillSubtotal + totalFees;

  if (!group) {
    return (
      <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-lg text-center p-12 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-500" />
        Loading group members...
      </Card>
    );
  }
  
  const participantIds = bill.participant_user_ids;
  let users =
    participantIds?.length
      ? (group.members?.filter((m) => participantIds.includes(m.user_id)) ?? []).map((m) => m.user)
      : group.members?.map((m) => m.user) ?? [];
  if (users.length === 0 && currentUser?.id) {
    users = [
      { id: currentUser.id, name: currentUser.displayName || 'You', email: currentUser.email || '', textract_usage_count: 0 },
    ];
  }

  const currencySign = getCurrencySymbol(group.currency || '$');

  return (
    <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-lg" noPadding allowOverflow>
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 rounded-t-[2rem]">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Bill Items</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Edit shares or use auto-split. <span className="md:hidden text-brand-500 font-medium">Scroll right to see all members →</span>
          </p>
        </div>
        {onSplitAllEqually && onResetAll && (
          <Button 
            variant={isResetMode ? "outline" : "secondary"} 
            onClick={() => {
              if (isResetMode) {
                onResetAll();
                setIsResetMode(false);
              } else {
                onSplitAllEqually(users.map(u => u.id));
                setIsResetMode(true);
              }
            }} 
            className={cn(
              "gap-2 shadow-sm text-xs h-9 px-4 transition-all duration-300",
              isResetMode && "border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-900/20"
            )}
          >
            {isResetMode ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Reset all quantities
              </>
            ) : (
              <>
                <Divide className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                Equally Split All
              </>
            )}
          </Button>
        )}
      </div>
      <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        <table className="w-auto text-left border-collapse min-w-full whitespace-nowrap">
          <thead>
          <tr className="bg-slate-100 dark:bg-slate-800/80 border-b-2 border-slate-300 dark:border-slate-600 text-[13px] text-slate-800 dark:text-slate-100 font-extrabold uppercase tracking-widest text-center">
            <th 
              ref={itemNameColRef}
              className="sticky top-0 z-20 w-auto border-r border-slate-200/50 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800/80 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)] p-0 relative item-name-col min-w-[200px]"
            >
              <div className="pl-5 pr-4 h-full flex flex-col items-start md:items-center justify-center" style={{ minHeight: '99px' }}>
                <span className="font-extrabold">Item Name</span>
              </div>
              <div 
                className="absolute top-0 right-[-3px] w-[6px] h-full cursor-col-resize hover:bg-brand-500/50 z-30 transition-colors"
                onMouseDown={handleMouseDown}
                title="Drag to resize"
              />
            </th>
            <th className="sticky top-0 z-20 p-5 text-right md:text-center w-auto border-r border-slate-200/50 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800/80 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">Unit Cost</th>
            {users.map((user, idx) => (
              <th key={user.id} className={cn("sticky top-0 z-20 p-5 text-center bg-slate-100 dark:bg-slate-800/80 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]", idx !== users.length - 1 && "border-r border-slate-200/50 dark:border-slate-700/50")}>
                <div className="flex flex-col items-center gap-1.5 group/user">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center justify-center font-extrabold ring-2 ring-transparent group-hover/user:ring-brand-200 dark:group-hover/user:ring-brand-700 transition-all shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {onRemoveUser && user.id !== currentUser?.id && (
                      <button
                        onClick={() => onRemoveUser(user.id, user.name)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/user:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                        title={`Remove ${user.name} from this bill`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
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
                <td className="p-3 border-r border-slate-200/50 dark:border-slate-700/50 item-name-col">
                  <div className="flex items-center gap-2 group/item">
                    {onDeleteItem && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this item?')) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => onUpdateItemDetails?.(item.id, e.target.value, item.unit_cost)}
                      className={cn(
                        "w-full min-w-[200px] bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:ring-0 px-2 py-1.5 font-semibold text-slate-800 dark:text-slate-200 transition-colors",
                        !onUpdateItemDetails && "pointer-events-none"
                      )}
                      placeholder="Item Name"
                    />
                  </div>
                </td>
                <td className="p-3 text-right border-r border-slate-200/50 dark:border-slate-700/50 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">{currencySign}</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_cost}
                    onChange={(e) => onUpdateItemDetails?.(item.id, item.item_name, parseFloat(e.target.value) || 0)}
                    className={cn(
                      "w-24 bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:ring-0 px-2 py-1.5 font-bold text-right text-slate-700 dark:text-slate-300 transition-colors",
                      !onUpdateItemDetails && "pointer-events-none"
                    )}
                  />
                </td>
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
          {/* Batch add items (staged until bill save) */}
          {onBulkAddItems && !draftOpen && (
            <tr>
              <td colSpan={99} className="p-3">
                <button
                  type="button"
                  onClick={openDraft}
                  className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 w-fit"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add items
                </button>
              </td>
            </tr>
          )}
          {onBulkAddItems && draftOpen &&
            draftRows.map((row, rowIdx) => (
              <tr
                key={row.key}
                className="bg-brand-50/50 dark:bg-brand-900/10 ring-1 ring-inset ring-brand-200 dark:ring-brand-800/60"
                onKeyDown={handleDraftKeyDown}
              >
                <td className="p-3 border-r border-slate-200/50 dark:border-slate-700/50 item-name-col">
                  <input
                    autoFocus={rowIdx === 0}
                    type="text"
                    value={row.name}
                    onChange={(e) => updateDraftRow(row.key, { name: e.target.value })}
                    placeholder="Item name..."
                    className="w-full min-w-[200px] bg-transparent border-0 border-b border-brand-300 dark:border-brand-700 focus:border-brand-500 focus:ring-0 px-2 py-1.5 font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  />
                </td>
                <td className="p-3 border-r border-slate-200/50 dark:border-slate-700/50 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">{currencySign}</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.cost}
                    onChange={(e) => updateDraftRow(row.key, { cost: e.target.value })}
                    placeholder="0.00"
                    className="w-24 bg-transparent border-0 border-b border-brand-300 dark:border-brand-700 focus:border-brand-500 focus:ring-0 px-2 py-1.5 font-bold text-right text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                  />
                </td>
                <td colSpan={99} className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {rowIdx === draftRows.length - 1 && (
                      <button
                        type="button"
                        onClick={addDraftRow}
                        className="flex items-center gap-1 rounded-lg bg-brand-100 px-3 py-1.5 text-xs font-bold text-brand-800 hover:bg-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:hover:bg-brand-900/60"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Another row
                      </button>
                    )}
                    {draftRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDraftRow(row.key)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          {onBulkAddItems && draftOpen && (
            <tr className="bg-brand-50/30 dark:bg-brand-900/5">
              <td colSpan={99} className="p-3">
                {draftError && (
                  <p className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">{draftError}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="primary" className="h-9 text-sm" onClick={submitAllDrafts}>
                    Add all to bill
                  </Button>
                  <Button type="button" variant="outline" className="h-9 text-sm" onClick={cancelDraft}>
                    Cancel
                  </Button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
        <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-200/80 dark:border-slate-700">
          <tr>
            <td className="p-5 text-right font-extrabold text-slate-700 dark:text-slate-300 rounded-bl-[2rem] border-r border-slate-200/50 dark:border-slate-700/50">Subtotal</td>
            <td className="p-5 text-right font-extrabold text-slate-800 dark:text-slate-100 border-r border-slate-200/50 dark:border-slate-700/50">
              <span className="text-sm font-black mr-0.5">{currencySign}</span>
              {totalBillSubtotal.toFixed(2)}
            </td>
            {users.map((user, idx) => (
              <td key={user.id} className={cn("p-5 text-center font-extrabold text-slate-800 dark:text-slate-100", idx !== users.length - 1 && "border-r border-slate-200/50 dark:border-slate-700/50")}>
                <span className="text-sm font-black mr-0.5">{currencySign}</span>
                {getSubtotalForUser(user.id).toFixed(2)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-5 py-3 text-right font-bold text-slate-500 dark:text-slate-400 text-sm border-r border-slate-200/50 dark:border-slate-700/50">Tax / Fees</td>
            <td className="px-5 py-3 text-right font-bold text-slate-500 dark:text-slate-400 text-sm border-r border-slate-200/50 dark:border-slate-700/50 relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">{currencySign}</div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={bill.total_tax}
                onChange={(e) => onUpdateTax?.(parseFloat(e.target.value) || 0)}
                className={cn(
                  "w-20 bg-transparent border-0 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:ring-0 px-2 py-0.5 text-right transition-colors",
                  !onUpdateTax && "pointer-events-none"
                )}
              />
            </td>
            {users.map((user, idx) => {
              const userSub = getSubtotalForUser(user.id);
              const userShareOfFees = totalBillSubtotal > 0 ? (userSub / totalBillSubtotal) * totalFees : 0;
              return (
                <td key={user.id} className={cn("px-5 py-3 text-center font-bold text-slate-500 dark:text-slate-400 text-sm", idx !== users.length - 1 && "border-r border-slate-200/50 dark:border-slate-700/50")}>
                   +<span className="font-black">{currencySign}</span>{userShareOfFees.toFixed(2)}
                </td>
              );
            })}
          </tr>
          <tr className="bg-brand-50/50 dark:bg-brand-900/10">
            <td className="p-5 text-right font-black text-brand-900 dark:text-brand-300 border-t border-brand-100 dark:border-brand-900/50 rounded-bl-[2rem] border-r border-brand-100/50 dark:border-brand-900/30">Grand Total</td>
            <td className="p-5 text-right font-black text-brand-700 dark:text-brand-400 text-xl border-t border-brand-100 dark:border-brand-900/50 border-r border-brand-100/50 dark:border-brand-900/30 font-black flex items-baseline justify-end">
              <span className="text-2xl mr-1">{currencySign}</span>
              <span>{billGrandTotal.toFixed(2)}</span>
            </td>
            {users.map((user, idx) => {
              const userSub = getSubtotalForUser(user.id);
              const userShareOfFees = totalBillSubtotal > 0 ? (userSub / totalBillSubtotal) * totalFees : 0;
              return (
                <td key={user.id} className={cn("p-5 text-center font-black text-brand-700 dark:text-brand-400 text-xl border-t border-brand-100 dark:border-brand-900/50", idx !== users.length - 1 && "border-r border-brand-100/50 dark:border-brand-900/30")}>
                  <div className="flex items-baseline justify-center">
                    <span className="text-2xl mr-1">{currencySign}</span>
                    <span>{(userSub + userShareOfFees).toFixed(2)}</span>
                  </div>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
      </div>
    </Card>
  );
}
