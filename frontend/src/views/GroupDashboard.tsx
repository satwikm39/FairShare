import { useState } from 'react';
import { Plus, Users, Loader2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGroups } from '../hooks/useGroups';
import { CreateGroupModal } from '../components/groups/CreateGroupModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export function GroupDashboard() {
  const { groups, isLoading, error, createGroup, deleteGroup } = useGroups();
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateGroup = async (name: string, currency: string) => {
    setIsCreating(true);
    try {
      await createGroup(name, currency);
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to create group.");
    } finally {
      setIsCreating(false);
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Your Groups</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your shared bills and recent activity.</p>
        </div>
        <Button 
          className="gap-2 px-6 shadow-brand-500/20" 
          onClick={() => setIsModalOpen(true)}
          isLoading={isCreating}
        >
          <Plus className="w-5 h-5" />
          New Group
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-medium border border-red-100 dark:border-red-900/50">
          Error loading groups: {error}
        </div>
      )}

      {isLoading && groups.length === 0 ? (
        <div className="flex justify-center items-center p-20 text-slate-400 dark:text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group.id} className="relative group">
              <Link to={`/groups/${group.id}`} className="block h-full">
                <Card className="h-full border border-slate-200/60 shadow-md group-hover:shadow-2xl group-hover:border-brand-200 transition-all duration-300">
                  <div className="flex flex-col h-full justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors pr-8">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-3 font-medium">
                        <Users className="w-4 h-4" />
                        <span>Multiple members</span> {/* Backend doesn't return member count yet */}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-400">
                      ID: {group.id}
                    </div>
                  </div>
                </Card>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setGroupToDelete(group.id);
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100"
                aria-label="Delete group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          
            <button 
            onClick={() => setIsModalOpen(true)}
            disabled={isCreating}
            className="h-full min-h-[200px] rounded-[2rem] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all flex flex-col justify-center items-center text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 gap-4 group disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 flex items-center justify-center transition-colors shadow-sm">
              {isCreating ? <Loader2 className="w-7 h-7 animate-spin" /> : <Plus className="w-7 h-7" />}
            </div>
            <span className="font-bold text-lg">{isCreating ? "Creating..." : "Create Group"}</span>
          </button>
        </div>
      )}

      <CreateGroupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateGroup} 
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
