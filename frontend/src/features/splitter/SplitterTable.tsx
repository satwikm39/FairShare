import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Minus, Plus, Loader2, PlusCircle, X, Trash2, Divide, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn, getCurrencySymbol } from '../../lib/utils';
import type { Bill, Group } from '../../types';
import { useAuth } from '../../context/AuthContext';

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
      { id: currentUser.id, name: currentUser.displayName || 'You', email: currentUser.email || '', textract_usage_count: 0 },
    ];
  }

  const currencySign = getCurrencySymbol(group.currency || '$');
  const totalTableWidth = itemNameColWidth + (users.length + 1) * 120;

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
            <th className="w-[120px] min-w-[120px] p-2 text-center border-r border-zinc-200/50 dark:border-zinc-700/50">Unit Cost</th>
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
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-sharp bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/user:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                        title={`Remove ${user.name} from this bill`}
                      >
                        <X className="w-2.5 h-2.5" />
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
