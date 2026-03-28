import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useBlocker } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, Loader2, ArrowLeft, UserCheck, UserPlus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SplitterTable } from '../features/splitter/SplitterTable';
import { useBill } from '../hooks/useBill';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { billsService } from '../services/bills';
import { cn, getCurrencySymbol } from '../lib/utils';
import { isDemoMode } from '../config/demo';
import type { GroupMemberResponse } from '../types';

export function BillOverview() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  // Default to 1 if no ID is provided, so it doesn't crash on invalid URLs
  const billId = parseInt(id || '1', 10);
  const { bill, isLoading, error, fetchBill, setBill, uploadReceipt, updateShare, splitAllEqually, resetAllShares, updateItemDetails, updateTax, bulkAddItems, deleteItem, hasUnsavedChanges, hasInvalidItems, isSavingShares, saveShares } = useBill(billId, {
    onSaveFailed: (message) => showToast(message, 'error'),
  });
  const { currentUser, refreshUserData } = useAuth();
  const [group, setGroup] = useState<any>(null);

  const textractLimitReached = (currentUser?.textract_usage_count ?? 0) >= 2;
  const [payerId, setPayerId] = useState<number | null>(null);
  const [isSavingPayer, setIsSavingPayer] = useState(false);

  const handleRemoveUserFromBill = useCallback(async (userId: number, userName: string) => {
    if (!window.confirm(`Remove ${userName} from this bill? All their shares will be cleared.`)) return;
    try {
      await billsService.removeUserFromBill(billId, userId);
      await fetchBill();
    } catch (e) {
      console.error(e);
      alert('Failed to remove user from bill.');
    }
  }, [billId, fetchBill]);

  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const handleAddParticipant = useCallback(async (userId: number) => {
    setAddingUserId(userId);
    try {
      await billsService.addParticipantToBill(billId, userId);
      await fetchBill();
    } catch (e: any) {
      console.error(e);
      showToast(e.response?.data?.detail || 'Failed to add person to bill.', 'error');
    } finally {
      setAddingUserId(null);
    }
  }, [billId, fetchBill, showToast]);

  const participantIds = bill?.participant_user_ids ?? [];
  const hasExplicitParticipants = participantIds.length > 0;
  const membersToAdd =
    hasExplicitParticipants && group?.members
      ? group.members.filter((m: GroupMemberResponse) => !participantIds.includes(m.user_id))
      : [];

  // Sync payerId from fetched bill
  useEffect(() => {
    if (bill?.paid_by_user_id !== undefined) {
      setPayerId(bill.paid_by_user_id);
    }
  }, [bill?.paid_by_user_id]);

  const handlePayerChange = useCallback(async (newPayerId: number | null) => {
    if (!bill) return;
    const previousPayerId = bill.paid_by_user_id;
    setPayerId(newPayerId);
    setIsSavingPayer(true);
    try {
      const updated = await billsService.updateBill(bill.id, { paid_by_user_id: newPayerId });
      // Patch payer only - do not fetchBill here or unsaved table edits are wiped.
      setBill((prev) =>
        prev ? { ...prev, paid_by_user_id: updated.paid_by_user_id } : null
      );
    } catch (err) {
      console.error('Failed to save payer:', err);
      setPayerId(previousPayerId ?? null);
      showToast('Could not update who paid.', 'error');
    } finally {
      setIsSavingPayer(false);
    }
  }, [bill, setBill, showToast]);

  useEffect(() => {
    fetchBill(billId);
  }, [billId, fetchBill]);

  useEffect(() => {
    if (bill?.group_id) {
      import('../services/groups').then(({ groupsService }) => {
        groupsService.getGroup(bill.group_id).then(setGroup).catch(console.error);
      });
    }
  }, [bill?.group_id]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges &&
      (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search)
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (hasUnsavedChanges && !hasInvalidItems) {
        saveShares().catch(console.error);
      }
      blocker.proceed();
    }
  }, [blocker, hasUnsavedChanges, hasInvalidItems, saveShares]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.log("DEBUG: handleUpload called but no selectedFile");
      return;
    }
    
    console.log(`DEBUG: handleUpload starting for bill_id: ${billId}, file: ${selectedFile.name}`);
    try {
      console.log("DEBUG: Calling uploadReceipt hook...");
      const newItems = await uploadReceipt(selectedFile);
      console.log("DEBUG: uploadReceipt hook completed successfully. Returned items:", newItems);
      await refreshUserData(); // Update usage count
      setUploadSuccess(true);
      setSelectedFile(null); // Clear selected file after successful upload
    } catch (err) {
      console.error("DEBUG ERR: handleUpload caught an error:", err);
      // useBill hook manages the error state displayed in the UI
    }
  };

  const demoActive = isDemoMode();
  // Navbar is h-16 (64px). Demo banner adds h-8 (32px).
  const navbarBottom = demoActive ? '6rem' : '4rem';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="sticky z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md pt-2 pb-4 mb-6 border-b border-zinc-200 dark:border-zinc-800" style={{ top: navbarBottom }}>
        <div className="flex items-center justify-between mb-3">
          <Link to={bill?.group_id ? `/groups/${bill.group_id}` : '/dashboard'} className="inline-flex items-center text-xs font-medium text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
            <ArrowLeft className="w-3 h-3 mr-1" /> Back to Group
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium">
            {isSavingShares ? (
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>
            ) : hasUnsavedChanges ? (
              <span className="text-slate-400 dark:text-slate-500">Unsaved changes</span>
            ) : bill ? (
              <span className="text-brand-600 dark:text-brand-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Saved</span>
            ) : null}
          </div>
        </div>
        <div className="flex justify-between items-start md:items-center gap-2 md:gap-4 flex-col md:flex-row">
            <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter truncate text-2xl md:text-3xl">
                  {isLoading && !bill ? 'Loading Bill...' : (bill?.name || (group?.name ? `${group.name} Bill` : 'Bill Details'))}
                </h1>
              </div>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs md:text-sm md:mt-1">
                {bill?.date && (
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-sharp border border-zinc-200 dark:border-zinc-700/50">
                    {new Date(bill.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                )}
                {bill && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400">Total:</span>
                    <span className="text-base md:text-lg font-black text-brand-600 dark:text-brand-400 flex items-baseline">
                      <span className="text-lg md:text-xl font-black mr-0.5">{getCurrencySymbol(group?.currency || '$')}</span>
                      <span>{bill.grand_total.toFixed(2)}</span>
                    </span>
                  </div>
                )}
                <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium italic hidden sm:block">Split exactly as ordered.</p>
              </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Sidebar Actions */}
        <div className="w-full lg:w-[190px] xl:w-[210px] space-y-4 shrink-0 flex flex-col items-center">
        {/* Payer Selection Card */}
        {group && (
          <Card className="w-full border-zinc-200 dark:border-zinc-800 shadow-lg px-3.5 py-3 md:px-3.5 md:py-3 flex flex-col items-center text-center bg-white dark:bg-black rounded-sharp">
          <div className="flex items-center justify-center gap-2 mb-2">
              <UserCheck className="w-3.5 h-3.5 text-brand-500" />
              <h3 className="font-black text-[10px] text-zinc-900 dark:text-white uppercase tracking-widest">Paid by</h3>
              {isSavingPayer && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
            </div>
            <div className="relative w-full">
              <select
                value={payerId ?? ''}
                onChange={(e) => handlePayerChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-sharp border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 font-bold px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/20 cursor-pointer appearance-none uppercase tracking-wider"
              >
                <option value="">(Not set)</option>
                {(bill?.participant_user_ids?.length
                  ? group.members?.filter((m: GroupMemberResponse) => bill.participant_user_ids!.includes(m.user_id))
                  : group.members
                )?.map((m: GroupMemberResponse) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {payerId && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {group.members?.find((m: any) => m.user.id === payerId)?.user.name} fronted this bill. Balances updated automatically.
              </p>
            )}
          </Card>
        )}

        {/* Add to Bill */}
        {hasExplicitParticipants && membersToAdd.length > 0 && (
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm p-4 md:p-5 bg-white dark:bg-black rounded-sharp w-full">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-3.5 h-3.5 text-brand-500" />
              <h3 className="font-black text-[10px] text-zinc-900 dark:text-white uppercase tracking-widest">Add to bill</h3>
            </div>
            <div className="space-y-2">
              {membersToAdd.map((m: GroupMemberResponse) => (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between gap-2 rounded-sharp bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 border border-zinc-200/50 dark:border-zinc-800/50"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                    {m.user.name}
                  </span>
                  <Button
                    variant="secondary"
                    className="shrink-0 h-7 text-xs px-3 py-1.5"
                    onClick={() => handleAddParticipant(m.user_id)}
                    disabled={addingUserId === m.user_id}
                    isLoading={addingUserId === m.user_id}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {/* Receipt Card */}
        <Card className="w-full border-zinc-200 dark:border-zinc-800 shadow-sm px-3.5 py-3 md:px-3.5 md:py-3 flex flex-col items-center text-center bg-white dark:bg-black rounded-sharp">
          <h3 className="font-black text-[10px] text-zinc-900 dark:text-white mb-2 uppercase tracking-widest text-center">Upload receipt</h3>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/jpeg, image/png, application/pdf"
            onChange={handleFileSelect}
          />

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-sharp px-3.5 py-4 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group w-full",
              selectedFile ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-zinc-300 dark:border-zinc-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10"
            )}
          >
            <div className={cn(
              "w-14 h-14 rounded-sharp flex items-center justify-center transition-colors border",
              selectedFile ? "bg-brand-500 border-brand-500 text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/50 group-hover:text-brand-600 dark:group-hover:text-brand-400 border-zinc-200 dark:border-zinc-700"
            )}>
              {selectedFile ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            </div>
            <div>
              <p className={cn("text-sm font-semibold", selectedFile ? "text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-300 group-hover:text-brand-700 dark:group-hover:text-brand-400")}>
                {selectedFile ? selectedFile.name : "Select Receipt"}
              </p>
              {!selectedFile && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">JPEG, PNG, or PDF</p>}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-sharp text-xs font-bold border border-red-100 dark:border-red-900/50 uppercase tracking-tight">
              {error}
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-sharp text-xs font-bold border border-green-100 dark:border-green-900/50 flex items-center gap-2 uppercase tracking-tight">
              <CheckCircle2 className="w-4 h-4" />
              Receipt processed
            </div>
          )}

          <Button 
            fullWidth 
            className="mt-2.5 shadow-brand-500/20" 
            variant={selectedFile ? "primary" : "secondary"}
            disabled={!selectedFile || isLoading || textractLimitReached}
            isLoading={isLoading}
            onClick={handleUpload}
          >
            {textractLimitReached ? "Premium Coming Soon" : (isLoading ? "Processing via AWS..." : "Process Receipt")}
          </Button>
          {textractLimitReached && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center font-medium">
              Textract limit reached (2 scans). Premium features coming soon!
            </p>
          )}
        </Card>

        </div>

      <div className="flex-1 w-full min-w-0">
        {isLoading && !bill ? (
          <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-lg text-center p-12 text-slate-500 dark:text-slate-400">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p>Loading bill details...</p>
            </div>
          </Card>
        ) : bill ? (
          <>
            <SplitterTable 
              bill={bill} 
              group={group} 
              onUpdateShare={updateShare} 
              onSplitAllEqually={splitAllEqually}
              onResetAll={resetAllShares}
              onUpdateItemDetails={updateItemDetails}
              onUpdateTax={updateTax}
              onBulkAddItems={bulkAddItems}
              onDeleteItem={deleteItem}
              onRemoveUser={handleRemoveUserFromBill}
              demoMode={demoActive}
            />
            {hasInvalidItems && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-sharp text-center">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">
                  Fix the items highlighted in red (they must have at least one assigned share).
                </span>
              </div>
            )}
          </>
        ) : (
          <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-lg text-center p-12 text-slate-500 dark:text-slate-400">
            <div className="flex flex-col items-center justify-center gap-4">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-lg text-slate-700 dark:text-slate-300">No Bill Found</p>
              <p>Upload a receipt to start splitting the bill.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  </div>
  );
}
