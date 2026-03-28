import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Receipt, Loader2, ArrowLeft, Trash2, Edit2, Calendar, Check, X, TrendingUp, TrendingDown, ArrowRight, RefreshCw, DollarSign, SortAsc, SortDesc, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGroupDetails } from '../hooks/useGroupDetails';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { groupsService } from '../services/groups';
import { AddMemberModal } from '../components/groups/AddMemberModal';
import { CreateBillModal } from '../components/groups/CreateBillModal';
import { EditGroupModal } from '../components/groups/EditGroupModal';
import { SettleUpModal } from '../components/groups/SettleUpModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { GroupBalances } from '../types';
import { getCurrencySymbol, getCurrencyCode } from '../lib/utils';

export function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { group, bills, isLoading, error, refresh, deleteBill } = useGroupDetails(groupId);
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ user_id: number; name: string } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [balances, setBalances] = useState<GroupBalances | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const [isSettleUpModalOpen, setIsSettleUpModalOpen] = useState(false);
  const [isTogglingSmartSync, setIsTogglingSmartSync] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAllDebts, setShowAllDebts] = useState(false);

  const sortedBills = [...bills].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const fetchBalances = async (forceRefresh = false) => {
    setIsLoadingBalances(true);
    try {
      const url = forceRefresh ? groupId + '?refresh=true' : groupId;
      const data = await groupsService.getGroupBalances(typeof url === 'number' ? url : groupId);
      setBalances(data);
    } catch (e) {
      console.error('Failed to fetch balances', e);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchBalances();
  }, [groupId]);

  const [billToDelete, setBillToDelete] = useState<number | null>(null);
  const [isDeletingBill, setIsDeletingBill] = useState(false);

  // Editing Bill State
  const [editingBillId, setEditingBillId] = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editDateValue, setEditDateValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const startEditingBill = (e: React.MouseEvent, billId: number, currentName: string | null, currentDate: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingBillId(billId);
    setEditNameValue(currentName || '');
    if (currentDate) {
      try {
        const d = new Date(currentDate);
        setEditDateValue(d.toISOString().split('T')[0]);
      } catch (err) {
        setEditDateValue('');
      }
    } else {
      setEditDateValue('');
    }
  };

  const cancelEditingBill = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingBillId(null);
    setEditNameValue('');
    setEditDateValue('');
  };

  const saveBillName = async (e: React.MouseEvent, billId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Default to the original name if they save an empty string, or we could allow it
    if (editNameValue.trim() === '') {
      cancelEditingBill(e);
      return;
    }
    
    setIsSavingName(true);
    try {
      const { billsService } = await import('../services/bills');
      const updateData: any = { name: editNameValue.trim() };
      if (editDateValue) {
        // Convert local date (YYYY-MM-DD) to ISO string expected by backend
        updateData.date = new Date(`${editDateValue}T00:00:00`).toISOString();
      }
      await billsService.updateBill(billId, updateData);
      // In a real app we would update the local cache, but we have a refresh helper
      await refresh();
      setEditingBillId(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to update bill details.', 'error');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCreateBill = async (name: string, date: string, participantUserIds: number[]) => {
    setIsCreatingBill(true);
    try {
      const newBill = await groupsService.createBill(groupId, {
        name,
        date,
        participant_user_ids: participantUserIds,
      });
      navigate(`/bills/${newBill.id}`);
    } catch (e: any) {
      console.error(e);
      showToast(e.response?.data?.detail || 'Failed to create new bill.', 'error');
    } finally {
      setIsCreatingBill(false);
    }
  };

  const handleAddMember = async (emails: string[]) => {
    let successCount = 0;
    for (const email of emails) {
      try {
        await groupsService.addMemberByEmail(groupId, email);
        successCount++;
      } catch (e: any) {
        console.error(`Failed to add ${email}:`, e);
        showToast(`Failed to add ${email}: ${e.response?.data?.detail || 'Unknown error'}`, 'error');
      }
    }
    
    if (successCount > 0) {
      showToast(`${successCount} friend${successCount > 1 ? 's' : ''} added to the group successfully!`, 'success');
      await refresh();
    }
  };

  const handleUpdateGroup = async (name: string, currency: string) => {
    try {
      await groupsService.updateGroup(groupId, { name, currency });
      setIsEditGroupModalOpen(false);
      await refresh();
    } catch (e) {
      console.error(e);
      showToast("Failed to update group.", 'error');
    }
  };

  const handleCreateSettlement = async (fromUserId: number, toUserId: number, amount: number) => {
    try {
      await groupsService.createSettlement(groupId, { from_user_id: fromUserId, to_user_id: toUserId, amount });
      showToast('Payment recorded successfully!', 'success');
      fetchBalances(true);
    } catch (e: any) {
      console.error(e);
      showToast(e.response?.data?.detail || 'Failed to record payment.', 'error');
    }
  };

  const handleToggleSmartSync = async () => {
    if (!group) return;
    setIsTogglingSmartSync(true);
    try {
      const newPref = !group.simplify_debts;
      await groupsService.updateGroup(groupId, { simplify_debts: newPref });
      showToast(newPref ? "Smart Sync enabled" : "Smart Sync disabled", 'success');
      await refresh();
      fetchBalances(true);
    } catch (e) {
      console.error(e);
      showToast("Failed to toggle Smart Sync", 'error');
    } finally {
      setIsTogglingSmartSync(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    try {
      await groupsService.removeGroupMember(groupId, memberToRemove.user_id);
      setMemberToRemove(null);
      await refresh();
      fetchBalances();
    } catch (e: any) {
      console.error(e);
      showToast(e.response?.data?.detail || 'Failed to remove member.', 'error');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleConfirmDeleteBill = async () => {
    if (!billToDelete) return;
    setIsDeletingBill(true);
    try {
      await deleteBill(billToDelete);
      setBillToDelete(null);
    } catch (e) {
      console.error(e);
      showToast("Failed to delete bill.", 'error');
    } finally {
      setIsDeletingBill(false);
    }
  };

  if (isLoading && !group) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 dark:text-brand-400" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center p-12 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sharp">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Group not found</h2>
        <p className="text-zinc-500 dark:text-zinc-500 mt-2 uppercase font-bold text-xs">The group you are looking for does not exist or you do not have access.</p>
        <Link to="/dashboard">
          <Button className="mt-6" variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link to="/dashboard" className="inline-flex items-center text-xs font-medium text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 mb-3 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-1" /> Back to Groups
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">{group.name}</h1>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1 rounded-sharp border border-brand-500/20 shadow-sm">
                <span className="flex items-center gap-1">
                  <span className="text-sm font-black italic">{getCurrencySymbol(group.currency)}</span>
                  <span className="text-sm font-black">{getCurrencyCode(group.currency)}</span>
                </span>
              </div>
              <button
                onClick={() => setIsEditGroupModalOpen(true)}
                className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-full transition-colors"
                title="Edit group"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 font-bold mt-1 uppercase tracking-wider">Manage bills and expenses.</p>
            {group.members && group.members.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {group.members.map(member => {
                  const isMe = member.user_id === currentUser?.id;
                  return (
                    <div key={member.user_id} className="group/member flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-sharp px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 uppercase tracking-tight">
                      <div className="w-4 h-4 rounded-sharp bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-[10px] font-black shrink-0 border border-brand-500/10">
                        {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span>{member.user?.name?.split(' ')[0] || member.user?.email || 'User'}</span>
                      {!isMe && (
                        <button
                          onClick={() => setMemberToRemove({ user_id: member.user_id, name: member.user?.name || member.user?.email || 'this member' })}
                          className="ml-1 p-0.5 bg-red-100 dark:bg-red-900/80 rounded-sharp text-zinc-400 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors border border-red-200 dark:border-red-800"
                          title={`Remove ${member.user?.name || 'member'} from group`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              variant="outline"
              className="w-full sm:w-auto h-9 text-xs"
              onClick={() => setIsAddMemberModalOpen(true)}
            >
              Add Friend
            </Button>
            <Button 
              className="gap-1.5 px-4 shadow-brand-500/20 w-full sm:w-auto h-9 text-xs" 
              onClick={() => setIsCreateBillModalOpen(true)}
              isLoading={isCreatingBill}
            >
              <Plus className="w-4 h-4" />
              New Bill
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 items-start mt-6">
        
        {/* ── Side Panel (Balances & Settings) - Top on Mobile ── */}
        <div className="order-first lg:order-last lg:col-span-1 lg:sticky lg:top-24 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            
            {/* Balances Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">Balances</h2>
                <button
                  onClick={() => fetchBalances(true)}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors uppercase tracking-wider"
                  title="Force-recalculate balances"
                >
                  <RefreshCw className="w-3 h-3" />
                  Recalculate
                </button>
              </div>

              {isLoadingBalances ? (
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-black rounded-sharp">
                  <div className="flex items-center justify-center py-6 text-zinc-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                  </div>
                </Card>
              ) : balances && (balances.debts.length > 0 || balances.balances.length > 0) ? (
                <div className="space-y-3">
                  <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 p-4 bg-white dark:bg-black rounded-sharp">

                    {/* Your personal summary */}
                    {currentUser && (() => {
                      const myNet = balances.my_net_amount;
                      const absNet = Math.abs(myNet);
                      if (absNet < 0.01) return (
                        <div className="flex items-center gap-3 p-3 rounded-sharp bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-4 py-3 bg-zinc-50 dark:bg-zinc-900 rounded-sharp border border-zinc-200 dark:border-zinc-800 w-full text-center">All settled up 🎉</span>
                        </div>
                      );
                      if (myNet > 0) return (
                        <div className="flex items-center gap-3 p-3 rounded-sharp bg-emerald-50 dark:bg-brand-900/10 border border-emerald-200 dark:border-brand-500/30">
                          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-brand-400 shrink-0" />
                          <span className="text-sm font-bold text-emerald-700 dark:text-brand-400 uppercase tracking-tight">
                            You are owed <strong><span className="text-base font-black italic">{getCurrencySymbol(group?.currency || '$')}</span><span className="text-lg tracking-tighter">{absNet.toFixed(2)}</span></strong>
                          </span>
                        </div>
                      );
                      return (
                        <div className="flex items-center gap-3 p-3 rounded-sharp bg-rose-50 dark:bg-red-900/10 border border-rose-200 dark:border-red-500/30">
                          <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-tight">
                            You owe <strong><span className="text-base font-black italic">{getCurrencySymbol(group?.currency || '$')}</span><span className="text-lg tracking-tighter">{absNet.toFixed(2)}</span></strong>
                          </span>
                        </div>
                      );
                    })()}

                    {/* Full debt list, collapsible on mobile */}
                    {balances.debts.length > 0 && (
                      <div className="space-y-2">
                        <button 
                          onClick={() => setShowAllDebts(!showAllDebts)}
                          className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-brand-600 transition-colors py-1 lg:cursor-default lg:hover:text-slate-400"
                        >
                          <span>Group Debts</span>
                          <span className="lg:hidden">
                            {showAllDebts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </button>
                        
                        <div className={`${showAllDebts ? 'block' : 'hidden lg:block'} space-y-2 transition-all`}>
                          {balances.debts.map((debt, i) => {
                            const isMe = debt.from_user_id === currentUser?.id || debt.to_user_id === currentUser?.id;
                            const iOwe = debt.from_user_id === currentUser?.id;
                            return (
                              <div
                                key={i}
                                className={`flex items-center justify-between gap-3 rounded-sharp px-4 py-3 text-[11px] font-black uppercase tracking-tight transition-all border ${
                                  isMe
                                    ? iOwe
                                      ? 'bg-rose-50 dark:bg-red-900/20 border-rose-200 dark:border-red-900/50 text-rose-800 dark:text-red-400'
                                      : 'bg-emerald-50 dark:bg-brand-900/20 border-emerald-200 dark:border-brand-900/50 text-emerald-800 dark:text-brand-400'
                                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-semibold truncate">{debt.from_user_name}</span>
                                  <ArrowRight className="w-4 h-4 shrink-0 text-slate-400" />
                                  <span className="font-semibold truncate">{debt.to_user_name}</span>
                                </div>
                                <span className="font-bold shrink-0"><span className="text-sm font-black">{getCurrencySymbol(group?.currency || '$')}</span>{debt.amount.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>

                  {balances.debts.length > 0 && (
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 gap-2 h-10"
                      onClick={() => setIsSettleUpModalOpen(true)}
                    >
                      <DollarSign className="w-4 h-4" />
                      Record a Payment
                    </Button>
                  )}
                </div>
              ) : (
                <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-2 text-center">
                    No balances yet.
                  </p>
                </Card>
              )}
            </div>

            {/* Smart Sync Toggle - Compact for Mobile */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm p-3 bg-white dark:bg-black rounded-sharp border-dashed">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    Smart Sync
                    {isTogglingSmartSync && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                  </h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                    Minimize payments.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSmartSync}
                  disabled={isTogglingSmartSync}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-sharp border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-brand-500/50 overflow-hidden ${
                    group.simplify_debts ? 'bg-brand-500' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                >
                  <span className="sr-only">Toggle Smart Sync</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-sharp bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      group.simplify_debts ? 'translate-x-[20px]' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Main Content (Bills list) - Bottom on Mobile ── */}
        <div className="order-last lg:order-first lg:col-span-2 space-y-4 w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">Group Bills</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 hover:text-brand-600 dark:text-zinc-500 dark:hover:text-brand-400 uppercase tracking-widest bg-white dark:bg-black px-2.5 py-1.5 rounded-sharp border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all flex-shrink-0"
                title={sortOrder === 'desc' ? 'Sorting by date (Newest First)' : 'Sorting by date (Oldest First)'}
              >
                {sortOrder === 'desc' ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
                <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
              </button>
            </div>
          </div>
          
          {/* Bills list */}
          <div className="flex flex-col gap-4">
            {sortedBills.length === 0 ? (
               <div className="text-center p-16 bg-zinc-50 dark:bg-black rounded-sharp border border-zinc-200 dark:border-zinc-800 shadow-inner">
                <Receipt className="w-12 h-12 text-zinc-300 dark:text-zinc-800 mx-auto mb-4" />
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">No bills yet</h3>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-500 mt-2 uppercase tracking-wide">Create a new bill to start splitting expenses.</p>
              </div>
            ) : (
              sortedBills.map(bill => (
                <div key={bill.id} className="relative group/bill">
                  <Link to={`/bills/${bill.id}`} className="block">
                    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:border-brand-500 dark:hover:border-brand-500 transition-all duration-300 py-4 px-6 bg-white dark:bg-black rounded-sharp">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        
                        {/* Bill Info Section */}
                        <div className="flex-1 min-w-0">
                          
                          {/* Name and Date Editing logic */}
                          {editingBillId === bill.id ? (
                            <div className="flex flex-col gap-2 mb-2" onClick={(e) => e.preventDefault()}>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text"
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sharp px-2 py-1 text-lg font-black text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 w-full max-w-xs uppercase tracking-tight"
                                  placeholder="Bill Name"
                                  autoFocus
                                />
                                <button
                                  onClick={(e) => saveBillName(e, bill.id)}
                                  disabled={isSavingName}
                                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded shrink-0"
                                  title="Save details"
                                >
                                  {isSavingName ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                </button>
                                <button
                                  onClick={cancelEditingBill}
                                  disabled={isSavingName}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded shrink-0"
                                  title="Cancel"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={editDateValue}
                                  onChange={(e) => setEditDateValue(e.target.value)}
                                  onClick={(e) => {
                                    try {
                                      if ('showPicker' in HTMLInputElement.prototype) {
                                        (e.target as HTMLInputElement).showPicker();
                                      }
                                    } catch (err) {}
                                  }}
                                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 w-full max-w-xs cursor-pointer"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover/bill:text-brand-600 dark:group-hover/bill:text-brand-400 transition-colors truncate">
                                {bill.name || `Bill #${bill.id}`}
                              </h3>
                              <button
                                onClick={(e) => startEditingBill(e, bill.id, bill.name, bill.date)}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded opacity-100 md:opacity-0 md:group-hover/bill:opacity-100 transition-opacity"
                                title="Edit bill details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {/* Items and Date metadata */}
                          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                              <Receipt className="w-4 h-4" />
                              {bill.items?.length || 0} items
                            </span>
                            
                            {bill.date && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {new Date(bill.date).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Grand Total Value */}
                        <div className="flex items-center gap-6 sm:pr-10">
                          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 flex items-baseline">
                            <span className="text-3xl font-black mr-1">{getCurrencySymbol(group.currency)}</span>
                            <span>{bill.grand_total.toFixed(2)}</span>
                          </div>
                        </div>

                      </div>
                    </Card>
                  </Link>
                  
                  {/* Delete Button */}
                  {editingBillId !== bill.id && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBillToDelete(bill.id);
                      }}
                      className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors z-10 opacity-100 md:opacity-0 md:group-hover/bill:opacity-100"
                      aria-label="Delete bill"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <AddMemberModal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)} 
        onSubmit={handleAddMember} 
      />

      <ConfirmModal
        isOpen={billToDelete !== null}
        onClose={() => setBillToDelete(null)}
        onConfirm={handleConfirmDeleteBill}
        title="Delete Bill"
        description="Are you sure you want to delete this bill? All parsed items and split shares will be permanently deleted. This action cannot be undone."
        confirmText="Delete Bill"
        isLoading={isDeletingBill}
        variant="danger"
      />

      <ConfirmModal
        isOpen={memberToRemove !== null}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        description={`Remove ${memberToRemove?.name} from this group? Their shares on existing bills will remain, but they will no longer be a group member.`}
        confirmText="Remove Member"
        isLoading={isRemovingMember}
        variant="danger"
      />

      <CreateBillModal
        isOpen={isCreateBillModalOpen}
        onClose={() => setIsCreateBillModalOpen(false)}
        onSubmit={handleCreateBill}
        members={group?.members ?? []}
      />

      <SettleUpModal
        isOpen={isSettleUpModalOpen}
        onClose={() => setIsSettleUpModalOpen(false)}
        onSubmit={handleCreateSettlement}
        members={group?.members ?? []}
        currentUserId={currentUser?.id ?? 0}
        currencySymbol={getCurrencySymbol(group.currency)}
      />

      <EditGroupModal
        isOpen={isEditGroupModalOpen}
        onClose={() => setIsEditGroupModalOpen(false)}
        onSubmit={handleUpdateGroup}
        initialName={group.name}
        initialCurrency={group.currency}
      />
    </div>
  );
}
