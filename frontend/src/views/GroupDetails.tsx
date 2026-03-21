import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Receipt, Loader2, ArrowLeft, Trash2, Edit2, Calendar, Check, X, TrendingUp, TrendingDown, ArrowRight, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGroupDetails } from '../hooks/useGroupDetails';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { groupsService } from '../services/groups';
import { AddMemberModal } from '../components/groups/AddMemberModal';
import { CreateBillModal } from '../components/groups/CreateBillModal';
import { EditGroupModal } from '../components/groups/EditGroupModal';
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

  const handleAddMember = async (email: string) => {
    try {
      await groupsService.addMemberByEmail(groupId, email);
      showToast('Friend added to the group successfully!', 'success');
      await refresh();
    } catch (e: any) {
      console.error(e);
      showToast(e.response?.data?.detail || 'Failed to add friend.', 'error');
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
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Group not found</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{error}</p>
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">{group.name}</h1>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1 rounded-full border border-brand-100/50 dark:border-brand-800/40 shadow-sm transition-all">
                <span className="flex items-center gap-1">
                  <span className="text-sm font-black">{getCurrencySymbol(group.currency)}</span>
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
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 italic">Manage bills and expenses.</p>
            {group.members && group.members.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {group.members.map(member => {
                  const isMe = member.user_id === currentUser?.id;
                  return (
                    <div key={member.user_id} className="group/member flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50">
                      <div className="w-4 h-4 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-[10px] font-bold shrink-0">
                        {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span>{member.user?.name?.split(' ')[0] || member.user?.email || 'User'}</span>
                      {!isMe && (
                        <button
                          onClick={() => setMemberToRemove({ user_id: member.user_id, name: member.user?.name || member.user?.email || 'this member' })}
                          className="ml-0.5 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover/member:opacity-100"
                          title={`Remove ${member.user?.name || 'member'} from group`}
                        >
                          <X className="w-3 h-3" />
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

      {/* ── Balance breakdown ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Balances</h2>
          <button
            onClick={() => fetchBalances(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
            title="Force-recalculate balances"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate
          </button>
        </div>

        {isLoadingBalances ? (
          <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading balances...</span>
            </div>
          </Card>
        ) : balances && (balances.debts.length > 0 || balances.balances.length > 0) ? (
          <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-sm space-y-4 p-4">

            {/* Your personal summary */}
            {currentUser && (() => {
              const myNet = balances.my_net_amount;
              const absNet = Math.abs(myNet);
              if (absNet < 0.01) return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">You are all settled up in this group 🎉</span>
                </div>
              );
              if (myNet > 0) return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Overall, you are owed <strong><span className="text-base font-black">{getCurrencySymbol(group?.currency || '$')}</span>{absNet.toFixed(2)}</strong> in this group.
                  </span>
                </div>
              );
              return (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40">
                  <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                    Overall, you owe <strong><span className="text-base font-black">{getCurrencySymbol(group?.currency || '$')}</span>{absNet.toFixed(2)}</strong> in this group.
                  </span>
                </div>
              );
            })()}

            {/* Full debt list, highlighting rows involving the current user */}
            {balances.debts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">All outstanding debts</p>
                {balances.debts.map((debt, i) => {
                  const isMe = debt.from_user_id === currentUser?.id || debt.to_user_id === currentUser?.id;
                  const iOwe = debt.from_user_id === currentUser?.id;
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        isMe
                          ? iOwe
                            ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 text-rose-800 dark:text-rose-300'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
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
            )}
          </Card>
        ) : (
          <Card className="border-slate-200/60 dark:border-slate-700/50 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400 py-2 text-center">
              No balances yet — set a payer on each bill to track who owes what.
            </p>
          </Card>
        )}
      </div>

      {/* ── Bills list ── */}
      <div className="flex flex-col gap-4">
        {bills.length === 0 ? (
          <div className="text-center p-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No bills yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Create a new bill to start splitting expenses.</p>
          </div>
        ) : (
          bills.map(bill => (
            <div key={bill.id} className="relative group/bill">
              <Link to={`/bills/${bill.id}`} className="block">
                <Card className="border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-500/50 transition-all duration-300 py-4 px-6">
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
                              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 w-full max-w-xs"
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
            </div>
          ))
        )}
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
        currentUserId={currentUser?.id ?? 0}
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
