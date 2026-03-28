import { useState, useEffect } from 'react';
import { Plus, Users, Loader2, Trash2, Edit2, TrendingUp, TrendingDown, Minus as MinusIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGroups } from '../hooks/useGroups';
import { groupsService } from '../services/groups';
import { CreateGroupModal } from '../components/groups/CreateGroupModal';
import { EditGroupModal } from '../components/groups/EditGroupModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { Group, GroupBalances } from '../types';
import { getCurrencySymbol, getCurrencyCode } from '../lib/utils';

export function GroupDashboard() {
  const { groups, isLoading, error, createGroup, deleteGroup, updateGroup } = useGroups();
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [groupBalances, setGroupBalances] = useState<Record<number, GroupBalances>>({});

  // Fetch balances for all groups once loaded
  useEffect(() => {
    if (groups.length === 0) return;
    groups.forEach(group => {
      groupsService.getGroupBalances(group.id)
        .then(balances => {
          setGroupBalances(prev => ({ ...prev, [group.id]: balances }));
        })
        .catch(() => {}); // Silently ignore if balances can't be fetched
    });
  }, [groups]);

  const handleCreateGroup = async (name: string, currency: string, emails: string[]) => {
    setIsCreating(true);
    try {
      await createGroup(name, currency, emails);
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to create group.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateGroup = async (name: string, currency: string) => {
    if (!groupToEdit) return;
    try {
      await updateGroup(groupToEdit.id, name, currency);
      setIsEditModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to update group.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGroup(groupToDelete);
      setGroupToDelete(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete group.");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDebtBadge = (groupId: number, currency: string) => {
    const bal = groupBalances[groupId];
    if (!bal) return null;

    const net = bal.my_net_amount;
    const absNet = Math.abs(net);

    if (absNet < 0.01) {
      return (
        <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-3 py-1.5 rounded-sharp w-fit">
          <MinusIcon className="w-3 h-3" />
          All settled
        </div>
      );
    }

    if (net > 0) {
      return (
        <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-sharp w-fit border border-emerald-200 dark:border-emerald-800/40">
          <TrendingUp className="w-3 h-3" />
          You're owed <span className="text-sm font-black mr-0.5">{getCurrencySymbol(currency)}</span>{absNet.toFixed(2)}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-sharp w-fit border border-rose-200 dark:border-rose-800/40">
        <TrendingDown className="w-3 h-3" />
        You owe <span className="text-sm font-black mr-0.5">{getCurrencySymbol(currency)}</span>{absNet.toFixed(2)}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Your Groups</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 font-bold uppercase tracking-wider">Manage your shared bills and recent activity.</p>
        </div>
        <Button 
          className="gap-2 px-6 shadow-brand-500/10 border-brand-500/20" 
          onClick={() => setIsModalOpen(true)}
          isLoading={isCreating}
        >
          <Plus className="w-5 h-5" />
          New Group
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-sharp font-medium border border-red-100 dark:border-red-900/50">
          Error loading groups: {error}
        </div>
      )}

      {isLoading && groups.length === 0 ? (
        <div className="flex justify-center items-center p-20 text-zinc-400 dark:text-zinc-600">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group.id} className="relative group">
              <Link to={`/groups/${group.id}`} className="block h-full">
                <Card className="h-full border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-brand-500 transition-all duration-300 bg-white dark:bg-black rounded-sharp">
                  <div className="flex flex-col h-full justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-zinc-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors pr-8 uppercase tracking-tighter">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-500 mt-2 text-[10px] font-black uppercase tracking-widest">
                        <Users className="w-3.5 h-3.5" />
                        <span>{group.members?.length ?? 0} participant{(group.members?.length ?? 0) !== 1 ? 's' : ''}</span>
                      </div>
                      {renderDebtBadge(group.id, group.currency)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest bg-brand-50/50 dark:bg-brand-900/10 px-2.5 py-1 rounded-sharp w-fit border border-brand-500/10 shadow-sm transition-all group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20">
                      <span className="flex items-center gap-1">
                        <span className="text-sm font-black italic">{getCurrencySymbol(group.currency)}</span>
                        <span className="text-sm font-black">{getCurrencyCode(group.currency)}</span>
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGroupToEdit(group);
                  setIsEditModalOpen(true);
                }}
                className="absolute top-4 right-12 p-2 text-zinc-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-sharp transition-colors z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 border border-transparent hover:border-brand-500/20"
                aria-label="Edit group"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGroupToDelete(group.id);
                }}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-sharp transition-colors z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 border border-transparent hover:border-red-500/20"
                aria-label="Delete group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
            <button 
            onClick={() => setIsModalOpen(true)}
            disabled={isCreating}
            className="h-full min-h-[220px] rounded-sharp border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-brand-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all flex flex-col justify-center items-center text-zinc-500 dark:text-zinc-500 hover:text-brand-600 dark:hover:text-brand-400 gap-4 group disabled:opacity-50"
          >
            <div className="w-16 h-16 rounded-sharp bg-zinc-50 dark:bg-zinc-900 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 flex items-center justify-center transition-colors border border-zinc-200 dark:border-zinc-800">
              {isCreating ? <Loader2 className="w-7 h-7 animate-spin" /> : <Plus className="w-7 h-7" />}
            </div>
            <span className="font-black text-xs uppercase tracking-widest">{isCreating ? "Creating..." : "Create New Group"}</span>
          </button>
        </div>
      )}

      <CreateGroupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateGroup} 
      />

      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateGroup}
        initialName={groupToEdit?.name || ''}
        initialCurrency={groupToEdit?.currency || '$'}
      />

      <ConfirmModal
        isOpen={groupToDelete !== null}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Group"
        description="Are you sure you want to delete this group? All bills and items will be permanently deleted. This action cannot be undone."
        confirmText="Delete Group"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
