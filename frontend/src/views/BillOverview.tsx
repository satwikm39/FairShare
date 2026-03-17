import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, Loader2, ArrowLeft, UserCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SplitterTable } from '../features/splitter/SplitterTable';
import { useBill } from '../hooks/useBill';
import { useAuth } from '../context/AuthContext';
import { cn, getCurrencySymbol } from '../lib/utils';

export function BillOverview() {
  const { id } = useParams<{ id: string }>();
  // Default to 1 if no ID is provided, so it doesn't crash on invalid URLs
  const billId = parseInt(id || '1', 10);
  const { bill, isLoading, error, fetchBill, uploadReceipt, updateShare, splitAllEqually, resetAllShares, updateItemDetails, updateTax, addItem, deleteItem, hasUnsavedChanges, isSavingShares, saveShares } = useBill(billId);
  const { currentUser, refreshUserData } = useAuth();
  const [group, setGroup] = useState<any>(null);

  const textractLimitReached = (currentUser?.textract_usage_count ?? 0) >= 2;
  const [payerId, setPayerId] = useState<number | null>(null);
  const [isSavingPayer, setIsSavingPayer] = useState(false);

  // Sync payerId from fetched bill
  useEffect(() => {
    if (bill?.paid_by_user_id !== undefined) {
      setPayerId(bill.paid_by_user_id);
    }
  }, [bill?.paid_by_user_id]);

  const handlePayerChange = useCallback(async (newPayerId: number | null) => {
    if (!bill) return;
    setPayerId(newPayerId);
    setIsSavingPayer(true);
    try {
      const { billsService } = await import('../services/bills');
      await billsService.updateBill(bill.id, { paid_by_user_id: newPayerId });
    } catch (err) {
      console.error('Failed to save payer:', err);
    } finally {
      setIsSavingPayer(false);
      fetchBill(billId);
    }
  }, [bill, billId, fetchBill]);

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

  const hasInvalidItems = bill?.items.some(item => {
    const totalShares = item.shares.reduce((sum, share) => sum + share.share_count, 0);
    return totalShares === 0;
  }) ?? false;
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link to={bill?.group_id ? `/groups/${bill.group_id}` : '/dashboard'} className="inline-flex items-center text-xs font-medium text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 mb-3 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-1" /> Back to Group
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {isLoading && !bill ? 'Loading Bill...' : (bill?.name || (group?.name ? `${group.name} Bill` : 'Bill Details'))}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              {bill?.date && (
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {new Date(bill.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              )}
              {bill && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Total:</span>
                  <span className="text-lg font-black text-brand-600 dark:text-brand-400 flex items-baseline">
                    <span className="text-xl font-black mr-0.5">{getCurrencySymbol(group?.currency || '$')}</span>
                    <span>{bill.grand_total.toFixed(2)}</span>
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">Split exactly as ordered.</p>
            </div>
          </div>
          {bill && hasUnsavedChanges && (
             <Button 
               variant="primary"
               className="shadow-brand-500/20 gap-2 px-5 py-2 h-10 text-sm"
               onClick={saveShares}
               isLoading={isSavingShares}
               disabled={hasInvalidItems || isSavingShares}
               title={hasInvalidItems ? "All items must have at least one assigned share." : ""}
             >
               <CheckCircle2 className="w-4 h-4" />
               Save Splits
             </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">

          {/* Payer Selection Card */}
          {group && (
            <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-3.5 h-3.5 text-brand-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Paid by</h3>
                {isSavingPayer && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </div>
              <div className="relative">
                <select
                  value={payerId ?? ''}
                  onChange={(e) => handlePayerChange(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer appearance-none"
                >
                  <option value="">— Not set —</option>
                  {group.members?.map((m: any) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              {payerId && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {group.members?.find((m: any) => m.user.id === payerId)?.user.name} fronted this bill. Balances updated automatically.
                </p>
              )}
            </Card>
          )}

          <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-sm p-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Receipt</h3>
            
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
                "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 transition-all cursor-pointer group",
                selectedFile ? "border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm",
                selectedFile ? "bg-brand-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 group-hover:text-brand-600 dark:group-hover:text-brand-400"
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
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium border border-green-100 dark:border-green-900/50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Receipt processed successfully
              </div>
            )}

            <Button 
              fullWidth 
              className="mt-6 shadow-brand-500/20" 
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
        
        <div className="lg:col-span-3">
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
                onUpdateItemDetails={updateItemDetails}
                onUpdateTax={updateTax}
                onAddItem={(name, cost) => addItem(name, cost).then(() => {})}
                onDeleteItem={deleteItem}
                onResetAll={resetAllShares}
              />
              {hasUnsavedChanges && (
                <div className="mt-6 flex justify-end w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    {hasInvalidItems && (
                      <span className="text-sm font-medium text-red-500 dark:text-red-400 text-center sm:text-right">
                        Please assign shares to all items highlighted in red.
                      </span>
                    )}
                    <Button
                      variant="primary"
                      className="shadow-brand-500/20 gap-2 px-8 w-full sm:w-auto"
                      onClick={saveShares}
                      isLoading={isSavingShares}
                      disabled={hasInvalidItems || isSavingShares}
                      title={hasInvalidItems ? "All items must have at least one assigned share." : ""}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Save Splits
                    </Button>
                  </div>
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
