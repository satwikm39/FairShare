import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Receipt, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGroupDetails } from '../hooks/useGroupDetails';
import { groupsService } from '../services/groups';
import { AddMemberModal } from '../components/groups/AddMemberModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { group, bills, isLoading, error, deleteBill } = useGroupDetails(groupId);
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  
  const [billToDelete, setBillToDelete] = useState<number | null>(null);
  const [isDeletingBill, setIsDeletingBill] = useState(false);

  const handleCreateBill = async () => {
    setIsCreatingBill(true);
    try {
      const newBill = await groupsService.createBill(groupId);
      // Navigate straight to the new bill overview to upload receipt
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
              onClick={handleCreateBill}
              isLoading={isCreatingBill}
            >
              <Plus className="w-5 h-5" />
              New Bill
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {bills.length === 0 ? (
          <div className="col-span-full text-center p-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No bills yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Create a new bill to start splitting expenses.</p>
          </div>
        ) : (
          bills.map(bill => (
            <div key={bill.id} className="relative group/bill">
              <Link to={`/bills/${bill.id}`} className="block h-full">
                <Card className="h-full border border-slate-200/60 dark:border-slate-700/50 shadow-md group-hover/bill:shadow-2xl group-hover/bill:border-brand-200 dark:group-hover/bill:border-brand-500/50 transition-all duration-300">
                  <div className="flex flex-col h-full justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 group-hover/bill:text-brand-600 dark:group-hover/bill:text-brand-400 transition-colors">
                        Bill #{bill.id}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-3 font-medium">
                        <Receipt className="w-4 h-4" />
                        <span>{bill.items?.length || 0} items</span>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-brand-600 dark:text-brand-400">
                      ${bill.grand_total.toFixed(2)}
                    </div>
                  </div>
                </Card>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setBillToDelete(bill.id);
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors z-10 opacity-0 group-hover/bill:opacity-100"
                aria-label="Delete bill"
              >
                <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
