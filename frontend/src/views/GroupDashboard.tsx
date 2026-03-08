import { Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Mock data
const MOCK_GROUPS = [
  { id: 1, name: "Miami Trip 🌴", members: 4, recentActivity: "Yesterday" },
  { id: 2, name: "Roommates", members: 3, recentActivity: "2 hours ago" }
];

export function GroupDashboard() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Your Groups</h1>
          <p className="text-lg text-slate-500 mt-2 font-medium">Manage your shared bills and recent activity.</p>
        </div>
        <Button className="gap-2 px-6 shadow-brand-500/20">
          <Plus className="w-5 h-5" />
          New Group
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_GROUPS.map(group => (
          <Link to={`/groups/${group.id}`} key={group.id} className="block group h-full">
            <Card className="h-full border border-slate-200/60 shadow-md group-hover:shadow-2xl group-hover:border-brand-200 transition-all duration-300">
              <div className="flex flex-col h-full justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                    {group.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-500 mt-3 font-medium">
                    <Users className="w-4 h-4" />
                    <span>{group.members} members</span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-400">
                  Last active: {group.recentActivity}
                </div>
              </div>
            </Card>
          </Link>
        ))}
        
        {/* Placeholder for creating new group */}
        <button className="h-full min-h-[200px] rounded-[2rem] border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all flex flex-col justify-center items-center text-slate-500 hover:text-brand-600 gap-4 group">
          <div className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors shadow-sm">
            <Plus className="w-7 h-7" />
          </div>
          <span className="font-bold text-lg">Create Group</span>
        </button>
      </div>
    </div>
  );
}
