import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Minus, Plus, Loader2, PlusCircle, X, Trash2, Divide, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn, getCurrencySymbol } from '../../lib/utils';
import type { Bill, Group } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface SplitterTableProps {
  bill: Bill;
  group?: Group | null;
  onUpdateShare: (itemId: number, userId: number, increment: number) => void;
  onSplitAllEqually?: (userIds: number[]) => void;
  onResetAll?: () => void;
  onUpdateItemDetails?: (itemId: number, name: string, cost: number) => void;
  onUpdateTax?: (tax: number) => void;
  /** Stage multiple new rows locally; they persist on the next bill save (auto or manual). */
  onBulkAddItems?: (items: { item_name: string; unit_cost: number }[]) => void;
  onDeleteItem?: (itemId: number) => Promise<void>;
  onRemoveUser?: (userId: number, userName: string) => void;
  demoMode?: boolean;
}

type DraftRow = { key: string; name: string; cost: string };

function newDraftRow(): DraftRow {
  return { key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: '', cost: '' };
}

export function SplitterTable({ bill, group, onUpdateShare, onSplitAllEqually, onResetAll, onUpdateItemDetails, onUpdateTax, onBulkAddItems, onDeleteItem, onRemoveUser, demoMode }: SplitterTableProps) {
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [itemNameColWidth, setItemNameColWidth] = useState(200);
  const [isResetMode, setIsResetMode] = useState(false);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Column resizing state (uncontrolled for performance)
  const itemNameColRef = useRef<HTMLTableCellElement>(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const headerScrollerRef = useRef<HTMLDivElement>(null);
  const bodyScrollerRef = useRef<HTMLDivElement>(null);

  const handleBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollerRef.current) {
      headerScrollerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !itemNameColRef.current) return;
    const newWidth = Math.max(150, startWidth.current + (e.pageX - startX.current));
    setItemNameColWidth(newWidth);
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

  useEffect(() => {
    const scroller = bodyScrollerRef.current;
    if (!scroller) return;

    const checkOverflow = () => {
      // Tolerate sub-pixel rounding differences that can create tiny phantom scroll.
      setHasHorizontalOverflow(scroller.scrollWidth - scroller.clientWidth > 2);
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(scroller);
    window.addEventListener('resize', checkOverflow);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [itemNameColWidth, bill.items.length, bill.participant_user_ids?.length, group?.members?.length]);
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

  const getTaxForUser = (userId: number) => {
    const userSub = getSubtotalForUser(userId);
    return totalBillSubtotal > 0 ? (userSub / totalBillSubtotal) * totalFees : 0;
  };

  const totalBillSubtotal = bill.items.reduce((sum, item) => sum + item.unit_cost, 0);
  const totalFees = bill.total_tax;
  const billGrandTotal = totalBillSubtotal + totalFees;

  if (!group) {
    return (
      <div className="border border-zinc-200 dark:border-zinc-800 shadow-lg text-center p-12 text-zinc-500 dark:text-zinc-500 rounded-sharp bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-500" />
        Loading members...
      </div>
    );
  }
  
  const participantIds = bill.participant_user_ids;
  let users =
    participantIds?.length
      ? (group.members?.filter((m) => participantIds.includes(m.user_id)) ?? []).map((m) => m.user)
      : group.members?.map((m) => m.user) ?? [];
  if (users.length === 0 && currentUser?.id) {
    users = [
      { id: currentUser.id, name: currentUser.displayName || 'You', email: currentUser.email || '', textract_usage_count: 0, is_admin: 0 },
    ];
  }

  const currencySign = getCurrencySymbol(group.currency || '$');
  const totalTableWidth = itemNameColWidth + (users.length + 1) * 120;

  const renderMobileItem = (item: any) => {
    const isExpanded = expandedItemId === item.id;
    const totalItemShares = item.shares.reduce((sum: number, share: any) => sum + share.share_count, 0);
    const isZeroShares = totalItemShares === 0;

    return (
      <div 
        key={item.id} 
        className={cn(
          "border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors relative",
          isZeroShares ? "bg-red-50/50 dark:bg-red-900/30" : isExpanded ? "bg-brand-50/30 dark:bg-brand-900/10" : "bg-white dark:bg-black"
        )}
      >
        {isExpanded && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 z-10" />}
        <div 
          className="p-4 grid grid-cols-[7fr_3fr] items-center cursor-pointer active:bg-zinc-50 dark:active:bg-zinc-900 gap-3" 
          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
        >
          <div className="min-w-0 pr-2">
            <h4 className={cn("font-bold text-zinc-900 dark:text-zinc-100 uppercase truncate", isExpanded ? "text-brand-700 dark:text-brand-400 text-[13px]" : "text-[13px]")}>
              {item.item_name}
            </h4>
          </div>

          <div className="flex items-center justify-end gap-2 pl-2">
            <span className={cn("font-black text-sm truncate", isExpanded ? "text-brand-700 dark:text-brand-400" : "text-zinc-900 dark:text-zinc-100")}>
              {currencySign}{item.unit_cost.toFixed(2)}
            </span>
            <div className={cn("transition-transform duration-200 shrink-0", isExpanded ? "rotate-180 text-brand-500" : "text-zinc-400")}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Name</label>
                <input
                  type="text"
                  value={item.item_name}
                  onChange={(e) => onUpdateItemDetails?.(item.id, e.target.value, item.unit_cost)}
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sharp px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-brand-500/50 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Cost</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">{currencySign}</span>
                  <input
                    type="number"
                    value={item.unit_cost}
                    onChange={(e) => onUpdateItemDetails?.(item.id, item.item_name, parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sharp pl-6 pr-2 py-2 text-xs font-black focus:ring-1 focus:ring-brand-500/50 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Split Shares</label>
              <div className="grid grid-cols-1 gap-1.5">
                {users.map(user => {
                  const userShareObj = item.shares.find((s: any) => s.user_id === user.id);
                  const currentShares = userShareObj ? userShareObj.share_count : 0;
                  return (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-sharp bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50">
                      <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">{user.name}</span>
                      <div className="flex items-center gap-3">
                         <button 
                          onClick={(e) => { e.stopPropagation(); onUpdateShare(item.id, user.id, currentShares - 1); }}
                          className={cn("p-1.5 rounded-sharp border transition-all", currentShares > 0 ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700" : "text-zinc-300 dark:text-zinc-700 border-transparent opacity-50 cursor-default")}
                          disabled={currentShares === 0}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-black text-xs">{currentShares}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onUpdateShare(item.id, user.id, currentShares + 1); }}
                          className="p-1.5 rounded-sharp bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-500/20 active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this item?')) onDeleteItem?.(item.id);
                }}
                className="flex items-center gap-1.5 p-1.5 text-red-500 hover:text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50/50 dark:bg-red-900/10 rounded-sharp"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMobileSummary = () => (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-3 px-2">
        <div className="h-[2px] flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Total Breakdown</span>
        <div className="h-[2px] flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="space-y-3">
        {users.map(user => {
          const userSub = getSubtotalForUser(user.id);
          const userTax = getTaxForUser(user.id);
          const userTotal = userSub + userTax;
          return (
            <div key={user.id} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-sharp p-4 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">{user.name}</span>
                <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                  {currencySign}{userTotal.toFixed(2)}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                  <span className="uppercase tracking-wider">Subtotal</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{currencySign}{userSub.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                  <span className="uppercase tracking-wider">Tax & Fees</span>
                  <span className="text-zinc-700 dark:text-zinc-300">+{currencySign}{userTax.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Global Tax Input for Mobile */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-sharp p-4 border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Update Total Tax</label>
          <div className="relative">
             <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">{currencySign}</span>
             <input
                type="number"
                min="0"
                step="0.01"
                value={bill.total_tax}
                onChange={(e) => onUpdateTax?.(parseFloat(e.target.value) || 0)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sharp pl-6 pr-2 py-1.5 text-xs font-black text-right w-24 outline-none focus:ring-1 focus:ring-brand-500/50"
              />
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 dark:bg-white rounded-sharp p-5 text-white dark:text-zinc-950 mt-6 shadow-xl border border-zinc-800 dark:border-zinc-200">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-black uppercase tracking-[0.2em] text-[10px] opacity-70">Final Amount</span>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Incl. Tax</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-black uppercase tracking-tighter text-sm">Grand Total</span>
          <span className="text-3xl font-black tracking-tighter">{currencySign}{billGrandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500 pb-10">
         {/* Mobile Header Actions */}
          {/* Participants Row for Mobile */}
          <div className="mb-2">
            <h3 className="font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest text-[9px] mb-2 px-1">Participants</h3>
            <div className="flex items-center gap-3 overflow-x-auto pt-2 pb-2 no-scrollbar px-1">
              {users.map(user => (
                <div key={user.id} className="relative shrink-0 flex flex-col items-center gap-1.5 min-w-[50px]">
                  <div className="w-10 h-10 rounded-sharp bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center justify-center font-black border border-brand-500/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[9px] font-extrabold text-zinc-600 dark:text-zinc-400 uppercase tracking-tighter truncate max-w-[60px]">{user.name.split(' ')[0]}</span>
                  {onRemoveUser && user.id !== currentUser?.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveUser(user.id, user.name); }}
                      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 flex items-center justify-center bg-red-100 dark:bg-red-900/80 rounded-sharp text-zinc-400 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors active:scale-90 shadow-sm border border-red-200 dark:border-red-800"
                      title={`Remove ${user.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 px-1">
             <div className="flex items-center justify-between">
               <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight text-sm">Bill Items</h3>
              {onSplitAllEqually && onResetAll && (
                <button
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
                    "flex items-center gap-1.5 px-3 py-2 rounded-sharp text-[10px] font-black uppercase tracking-widest border transition-all",
                    isResetMode ? "border-orange-200 text-orange-600 bg-orange-50 dark:border-orange-900/40 dark:text-orange-400 dark:bg-orange-900/10" : "border-zinc-200 text-zinc-600 bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:bg-zinc-900/50"
                  )}
                >
                  {isResetMode ? <RotateCcw className="w-3 h-3" /> : <Divide className="w-3 h-3" />}
                  {isResetMode ? "Reset" : "Auto-Split"}
                </button>
              )}
            </div>
         </div>

         <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sharp overflow-hidden shadow-sm">
            {bill.items.map(renderMobileItem)}
            
            {onBulkAddItems && (
              <button
                onClick={openDraft}
                className="w-full p-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors border-t border-dashed border-zinc-200 dark:border-zinc-800"
              >
                <PlusCircle className="w-4 h-4" />
                Add New Item
              </button>
            )}
         </div>

         {/* Draft Rows for Mobile */}
         {draftOpen && (
           <div className="bg-brand-50/10 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800/50 rounded-sharp p-4 space-y-4">
              {draftRows.map((row) => (
                <div key={row.key} className="space-y-3 pb-3 border-b border-brand-100 dark:border-brand-800/30 last:border-0 last:pb-0">
                   <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateDraftRow(row.key, { name: e.target.value })}
                    placeholder="Item name"
                    className="w-full bg-transparent border-0 border-b border-brand-300 dark:border-brand-700 focus:border-brand-500 focus:ring-0 px-1 py-1 font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase"
                  />
                  <div className="flex items-center justify-between">
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">{currencySign}</span>
                      <input
                        type="number"
                        value={row.cost}
                        onChange={(e) => updateDraftRow(row.key, { cost: e.target.value })}
                        placeholder="0.00"
                        className="bg-transparent border-0 border-b border-brand-300 dark:border-brand-700 focus:border-brand-500 focus:ring-0 pl-4 py-1 font-black text-sm w-24"
                      />
                    </div>
                    {draftRows.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); removeDraftRow(row.key); }} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={addDraftRow} className="text-[10px] font-black uppercase tracking-widest text-brand-700 dark:text-brand-400 py-2 border border-brand-500/20 rounded-sharp">Add Another Row</button>
                <div className="flex gap-2">
                  <Button className="flex-1 h-9 text-xs" onClick={submitAllDrafts}>Save All</Button>
                  <Button variant="outline" className="flex-1 h-9 text-xs" onClick={cancelDraft}>Cancel</Button>
                </div>
              </div>
           </div>
         )}

         {renderMobileSummary()}
      </div>
    );
  }

  return (
    <Card className="border-zinc-200/60 dark:border-zinc-700/50 shadow-lg overflow-visible w-fit max-w-full" noPadding allowOverflow style={{ width: `${totalTableWidth}px` }}>
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-black rounded-t-sharp">
        <div>
          <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">Bill Items</h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-0.5 uppercase font-bold tracking-wider">
            Edit shares or use auto-split <span className="md:hidden text-brand-500">(Scroll right →)</span>
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
                onSplitAllEqually(users.map((u) => u.id));
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
      <div 
        className="sticky z-30 overflow-hidden bg-zinc-50 dark:bg-black border-b-2 border-zinc-200 dark:border-zinc-800"
        style={{ top: demoMode ? '10.25rem' : '8.25rem', width: `${totalTableWidth}px`, maxWidth: '100%' }}
        ref={headerScrollerRef}
      >
        <table className="text-left border-collapse whitespace-nowrap table-fixed" style={{ width: `${totalTableWidth}px` }}>
          <colgroup>
            <col style={{ width: `${itemNameColWidth}px` }} />
            <col style={{ width: '120px' }} />
            {users.map(user => <col key={user.id} style={{ width: '120px' }} />)}
          </colgroup>
          <thead>
          <tr className="text-[13px] text-zinc-800 dark:text-zinc-100 font-extrabold uppercase tracking-widest text-center">
            <th 
              ref={itemNameColRef}
              className="border-r border-zinc-200/50 dark:border-zinc-700/50 p-0 relative item-name-col"
              style={{ width: `${itemNameColWidth}px`, minWidth: `${itemNameColWidth}px`, maxWidth: `${itemNameColWidth}px` }}
            >
              <div className="pl-5 pr-4 flex flex-col items-start md:items-center justify-center min-h-[64px]">
                <span className="font-extrabold">Item Name</span>
                <span className="mt-0.5 text-[10px] normal-case tracking-normal font-semibold text-brand-600 dark:text-brand-400">
                  Drag right edge to resize table
                </span>
              </div>
              <div 
                className="absolute top-0 right-[-3px] w-[6px] h-full cursor-col-resize bg-brand-500/20 hover:bg-brand-500/50 z-30 transition-colors"
                onMouseDown={handleMouseDown}
                title="Drag right edge to resize table"
              />
            </th>
            <th className="w-[120px] min-w-[120px] p-2 text-center border-r border-zinc-200/50 dark:border-zinc-700/50">Cost</th>
            {users.map((user, idx) => (
              <th key={user.id} className={cn("w-[120px] min-w-[120px] p-2 text-center", idx !== users.length - 1 && "border-r border-zinc-200/50 dark:border-zinc-700/50")}>
                <div className="flex flex-col items-center gap-1.5 group/user py-1">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-sharp bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 flex items-center justify-center font-black border border-brand-500/20 group-hover/user:border-brand-500 transition-all">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {onRemoveUser && user.id !== currentUser?.id && (
                      <button
                        onClick={() => onRemoveUser(user.id, user.name)}
                        className="absolute -top-2 -right-2 w-4.5 h-4.5 flex items-center justify-center bg-red-100 dark:bg-red-900/80 rounded-sharp text-zinc-400 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors shadow-sm border border-red-200 dark:border-red-800"
                        title={`Remove ${user.name} from this bill`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">{user.name.split(' ')[0]}</span>
                </div>
              </th>
            ))}
          </tr>
          </thead>
        </table>
      </div>

      <div 
        ref={bodyScrollerRef}
        className={cn(
          "rounded-b-sharp bill-table-scrollbar",
          hasHorizontalOverflow ? "overflow-x-auto" : "overflow-x-hidden"
        )}
        style={{ width: `${totalTableWidth}px`, maxWidth: '100%' }}
        onScroll={handleBodyScroll}
      >
        <table className="text-left border-collapse whitespace-nowrap table-fixed" style={{ width: `${totalTableWidth}px` }}>
          <colgroup>
            <col style={{ width: `${itemNameColWidth}px` }} />
            <col style={{ width: '120px' }} />
            {users.map(user => <col key={user.id} style={{ width: '120px' }} />)}
          </colgroup>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {bill.items.map(item => {
            const totalItemShares = item.shares.reduce((sum, share) => sum + share.share_count, 0);
            const isZeroShares = totalItemShares === 0;
            return (
              <tr key={item.id} className={cn("transition-colors group", isZeroShares ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50")}>
                <td
                  className="p-3 border-r border-zinc-200/50 dark:border-zinc-700/50 item-name-col"
                  style={{ width: `${itemNameColWidth}px`, minWidth: `${itemNameColWidth}px`, maxWidth: `${itemNameColWidth}px` }}
                >
                  <div className="flex items-center gap-2 group/item">
                    {onDeleteItem && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this item?')) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
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
                        "w-full min-w-0 bg-transparent border-0 border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-brand-500 focus:ring-0 px-2 py-1.5 font-bold text-zinc-900 dark:text-zinc-100 transition-colors uppercase tracking-tight text-sm",
                        !onUpdateItemDetails && "pointer-events-none"
                      )}
                      placeholder="Item Name"
                    />
                  </div>
                </td>
                <td className="p-3 text-center border-r border-zinc-200/50 dark:border-zinc-700/50 relative w-[120px] min-w-[120px]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-sm">{currencySign}</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_cost}
                    onChange={(e) => onUpdateItemDetails?.(item.id, item.item_name, parseFloat(e.target.value) || 0)}
                    className={cn(
                      "w-[80px] bg-transparent border-0 border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-brand-500 focus:ring-0 px-2 py-1.5 font-black text-right text-zinc-900 dark:text-zinc-100 transition-colors",
                      !onUpdateItemDetails && "pointer-events-none"
                    )}
                  />
                </td>
                {users.map((user, idx) => {
                  const userShareObj = item.shares.find(s => s.user_id === user.id);
                  const currentShares = userShareObj ? userShareObj.share_count : 0;
                  
                  return (
                    <td key={user.id} className={cn("p-5 text-center w-[120px] min-w-[120px]", idx !== users.length - 1 && "border-r border-zinc-200/50 dark:border-zinc-700/50")}>
                      <div className="flex items-center justify-center gap-2.5">
                        <button 
                          onClick={() => onUpdateShare(item.id, user.id, currentShares - 1)}
                          className={cn("p-1.5 rounded-sharp transition-all border active:scale-95", currentShares > 0 ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700' : 'bg-transparent text-zinc-300 dark:text-zinc-700 border-transparent cursor-default')}
                          disabled={currentShares === 0}
                        >
                         <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-4 text-center font-black text-zinc-900 dark:text-white text-sm">{currentShares}</span>
                      <button 
                         onClick={() => onUpdateShare(item.id, user.id, currentShares + 1)}
                        className="p-1.5 rounded-sharp bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-400 transition-all border border-brand-500/10 hover:border-brand-500 active:scale-95"
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
                  className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors px-2 py-1.5 rounded-sharp hover:bg-brand-50 dark:hover:bg-brand-900/20 w-fit"
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
                <td
                  className="p-3 border-r border-zinc-200 dark:border-zinc-800 item-name-col"
                  style={{ width: `${itemNameColWidth}px`, minWidth: `${itemNameColWidth}px`, maxWidth: `${itemNameColWidth}px` }}
                >
                  <input
                    autoFocus={rowIdx === 0}
                    type="text"
                    value={row.name}
                    onChange={(e) => updateDraftRow(row.key, { name: e.target.value })}
                    placeholder="Item name..."
                    className="w-full min-w-0 bg-transparent border-0 border-b border-brand-300 dark:border-brand-700 focus:border-brand-500 focus:ring-0 px-2 py-1.5 font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 uppercase tracking-tight text-sm"
                  />
                </td>
                <td className="p-3 border-r border-zinc-200 dark:border-zinc-800 text-center relative w-[120px] min-w-[120px]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm">{currencySign}</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.cost}
                    onChange={(e) => updateDraftRow(row.key, { cost: e.target.value })}
                    placeholder="0.00"
                    className="w-[80px] bg-transparent border-0 border-b border-brand-300 dark:border-brand-700 focus:border-brand-500 focus:ring-0 px-2 py-1.5 font-black text-right text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
                  />
                </td>
                <td colSpan={99} className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {rowIdx === draftRows.length - 1 && (
                      <button
                        type="button"
                        onClick={addDraftRow}
                        className="flex items-center gap-1 rounded-sharp bg-brand-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-700 border border-brand-500/20 hover:border-brand-500 dark:bg-brand-900/20 dark:text-brand-400 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Another row
                      </button>
                    )}
                    {draftRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDraftRow(row.key)}
                        className="rounded-sharp p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all"
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
        <tfoot className="bg-zinc-50 dark:bg-black border-t-2 border-zinc-200 dark:border-zinc-800">
          <tr>
            <td
              className="p-5 text-right font-black text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800 item-name-col uppercase tracking-tighter"
              style={{ width: `${itemNameColWidth}px`, minWidth: `${itemNameColWidth}px`, maxWidth: `${itemNameColWidth}px` }}
            >
              Subtotal
            </td>
            <td className="p-5 text-center font-black text-zinc-900 dark:text-white border-r border-zinc-200 dark:border-zinc-800 w-[120px] min-w-[120px]">
              <span className="text-sm font-black mr-0.5 italic">{currencySign}</span>
              {totalBillSubtotal.toFixed(2)}
            </td>
            {users.map((user, idx) => (
              <td key={user.id} className={cn("p-5 text-center font-black text-zinc-900 dark:text-white w-[120px] min-w-[120px]", idx !== users.length - 1 && "border-r border-zinc-200 dark:border-zinc-800")}>
                <span className="text-sm font-black mr-0.5 italic">{currencySign}</span>
                {getSubtotalForUser(user.id).toFixed(2)}
              </td>
            ))}
          </tr>
          <tr>
            <td
              className="px-5 py-3 text-right font-bold text-zinc-500 dark:text-zinc-500 text-[10px] border-r border-zinc-200 dark:border-zinc-800 item-name-col uppercase tracking-widest"
              style={{ width: `${itemNameColWidth}px`, minWidth: `${itemNameColWidth}px`, maxWidth: `${itemNameColWidth}px` }}
            >
              Tax / Fees
            </td>
            <td className="px-5 py-3 text-center font-bold text-zinc-500 dark:text-zinc-500 text-[10px] border-r border-zinc-200 dark:border-zinc-800 relative w-[120px] min-w-[120px]">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black">{currencySign}</div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={bill.total_tax}
                onChange={(e) => onUpdateTax?.(parseFloat(e.target.value) || 0)}
                className={cn(
                  "w-16 bg-transparent border-0 border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-brand-500 focus:ring-0 px-2 py-0.5 text-right transition-colors text-[10px] font-black text-zinc-900 dark:text-zinc-100",
                  !onUpdateTax && "pointer-events-none"
                )}
              />
            </td>
            {users.map((user, idx) => {
              const userSub = getSubtotalForUser(user.id);
              const userShareOfFees = totalBillSubtotal > 0 ? (userSub / totalBillSubtotal) * totalFees : 0;
              return (
                <td key={user.id} className={cn("px-5 py-3 text-center font-bold text-zinc-500 dark:text-zinc-500 text-[10px] w-[120px] min-w-[120px] uppercase tracking-wider", idx !== users.length - 1 && "border-r border-zinc-200 dark:border-zinc-800")}>
                   +<span className="font-black italic">{currencySign}</span>{userShareOfFees.toFixed(2)}
                </td>
              );
            })}
          </tr>
          <tr className="bg-brand-50/50 dark:bg-brand-900/10">
            <td
              className="p-5 text-right font-black text-brand-600 dark:text-brand-400 border-t-2 border-brand-500/20 border-r border-zinc-200 dark:border-zinc-800 item-name-col uppercase tracking-tighter text-lg bg-brand-500/[0.02]"
              style={{ width: `${itemNameColWidth}px`, minWidth: `${itemNameColWidth}px`, maxWidth: `${itemNameColWidth}px` }}
            >
              Grand Total
            </td>
            <td className="p-5 text-center font-black text-brand-600 dark:text-brand-400 text-2xl border-t-2 border-brand-500/20 border-r border-zinc-200 dark:border-zinc-800 font-black flex items-baseline justify-center w-[120px] min-w-[120px] bg-brand-500/[0.02]">
              <span className="text-3xl mr-1 italic">{currencySign}</span>
              <span className="tracking-tighter">{billGrandTotal.toFixed(2)}</span>
            </td>
      {users.map((user, idx) => {
              const userSub = getSubtotalForUser(user.id);
              const userShareOfFees = totalBillSubtotal > 0 ? (userSub / totalBillSubtotal) * totalFees : 0;
              return (
                <td key={user.id} className={cn("p-5 text-center font-black text-brand-700 dark:text-brand-400 text-xl border-t border-brand-500/20 w-[120px] min-w-[120px]", idx !== users.length - 1 && "border-r border-brand-500/10")}>
                  <div className="flex items-baseline justify-center">
                    <span className="text-2xl mr-1 italic">{currencySign}</span>
                    <span className="tracking-tighter">{(userSub + userShareOfFees).toFixed(2)}</span>
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
