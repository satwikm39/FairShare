import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Receipt, Loader2, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGroupDetails } from '../hooks/useGroupDetails';
import { groupsService } from '../services/groups';

export function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { group, bills, isLoading, error } = useGroupDetails(groupId);
  const [isCreatingBill, setIsCreatingBill] = useState(false);

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

  if (isLoading && !group) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold text-slate-800">Group not found</h2>
        <p className="text-slate-500 mt-2">{error}</p>
        <Link to="/dashboard">
          <Button className="mt-6" variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Groups
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{group.name}</h1>
            <p className="text-lg text-slate-500 mt-2 font-medium">Manage this group's bills and expenses.</p>
          </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {bills.length === 0 ? (
          <div className="col-span-full text-center p-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No bills yet</h3>
            <p className="text-slate-500 mt-2">Create a new bill to start splitting expenses.</p>
          </div>
        ) : (
          bills.map(bill => (
            <Link to={`/bills/${bill.id}`} key={bill.id} className="block group h-full">
              <Card className="h-full border border-slate-200/60 shadow-md group-hover:shadow-2xl group-hover:border-brand-200 transition-all duration-300">
                <div className="flex flex-col h-full justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                      Bill #{bill.id}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-500 mt-3 font-medium">
                      <Receipt className="w-4 h-4" />
                      <span>{bill.items?.length || 0} items</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-brand-600">
                    ${bill.grand_total.toFixed(2)}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
