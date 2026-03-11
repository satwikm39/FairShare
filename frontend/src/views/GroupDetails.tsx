import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Receipt, Loader2, ArrowLeft, Trash2, Edit2, Calendar, Check, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGroupDetails } from '../hooks/useGroupDetails';
import { groupsService } from '../services/groups';
import { AddMemberModal } from '../components/groups/AddMemberModal';
import { CreateBillModal } from '../components/groups/CreateBillModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { group, bills, isLoading, error, refresh, deleteBill } = useGroupDetails(groupId);
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isCreateBillModalOpen, setIsCreateBillModalOpen] = useState(false);
  
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
      alert('Failed to update bill details.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCreateBill = async (name: string, date: string) => {
    setIsCreatingBill(true);
    try {
      const newBill = await groupsService.createBill(groupId, { name, date });
      // Navigate straight to the new bill overview to upload receipt or add items manually
      navigate(`/bills/${newBill.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create new bill.');
      setIsCreatingBill(false);
    }
  };

  const handleAddMember = async (email: string) => {
    try {
      await groupsService.addMemberByEmail(groupId, email);
      alert('Friend added to the group successfully!');
      // In a real app we might refetch group members here to show them in the UI
    } catch (e: any) {
      console.error(e);
      // If the backend returns a 404 or 400 from our recent changes, it will be caught here
      alert(e.response?.data?.detail || 'Failed to add friend.');
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
      alert("Failed to delete bill.");
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-600 dark:text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Groups
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{group.name}</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage this group's bills and expenses.</p>
            {group.members && group.members.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {group.members.map(member => (
                  <div key={member.user_id} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold shrink-0">
                      {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    {member.user?.name || member.user?.email || 'Unknown User'}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setIsAddMemberModalOpen(true)}
            >
              Add Friend
            </Button>
            <Button 
              className="gap-2 px-6 shadow-brand-500/20" 
              onClick={() => setIsCreateBillModalOpen(true)}
              isLoading={isCreatingBill}
            >
              <Plus className="w-5 h-5" />
              New Bill
            </Button>
          </div>
        </div>
      </div>

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
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover/bill:text-brand-600 dark:group-hover/bill:text-brand-400 transition-colors truncate">
                            {bill.name || `Bill #${bill.id}`}
                          </h3>
                          <button
                            onClick={(e) => startEditingBill(e, bill.id, bill.name, bill.date)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded opacity-0 group-hover/bill:opacity-100 transition-opacity"
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
                      <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
                        ${bill.grand_total.toFixed(2)}
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
                className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors z-10 opacity-0 group-hover/bill:opacity-100"
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

      <CreateBillModal
        isOpen={isCreateBillModalOpen}
        onClose={() => setIsCreateBillModalOpen(false)}
        onSubmit={handleCreateBill}
      />
    </div>
  );
}
