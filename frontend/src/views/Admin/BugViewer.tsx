import { useState, useEffect } from 'react';
import { Bug, Calendar, CheckCircle2, XCircle, Info, Maximize2, ChevronRight, Monitor, Globe, Clock, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { bugsService, type BugReport } from '../../services/bugs';
import { cn } from '../../lib/utils';

export function BugViewer() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [fullScreenshot, setFullScreenshot] = useState<string | null>(null);

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    setIsLoading(true);
    try {
      const data = await bugsService.getBugs();
      // Sort by latest first
      setBugs(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error('Failed to fetch bugs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <Bug className="w-8 h-8 text-red-500" />
            Bug Reports
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Internal bug tracking and diagnostics for FairShare.</p>
        </div>
        <Button onClick={fetchBugs} variant="secondary" className="md:w-auto w-full">
          Refresh List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bug List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed animate-pulse">
               <Bug className="w-12 h-12 text-zinc-200 dark:text-zinc-800 animate-bounce" />
               <p className="text-zinc-400 mt-4 font-medium italic">Fetching latest reports...</p>
            </div>
          ) : bugs.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-bold dark:text-white">No Bugs Found</h3>
              <p className="text-zinc-500">Your application is looking split-tasticly clean!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {bugs.map((bug) => (
                <div 
                  key={bug.id}
                  onClick={() => setSelectedBug(bug)}
                  className={cn(
                    "group cursor-pointer p-5 transition-all duration-300 border rounded-2xl",
                    "bg-white dark:bg-zinc-950",
                    selectedBug?.id === bug.id 
                      ? "border-red-500 ring-4 ring-red-500/5 translate-x-1" 
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                           #{bug.id}
                         </span>
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                           bug.status === 'open' ? "bg-red-100 dark:bg-red-900/20 text-red-600" : "bg-green-100 dark:bg-green-900/20 text-green-600"
                         )}>
                           {bug.status}
                         </span>
                         <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                           <Calendar className="w-3 h-3" />
                           {new Date(bug.created_at).toLocaleString()}
                         </span>
                       </div>
                       <h3 className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:line-clamp-none transition-all">
                         {bug.description}
                       </h3>
                       <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                         <span className="flex items-center gap-1">
                           <Globe className="w-3 h-3" />
                           {bug.metadata_json?.url ? new URL(bug.metadata_json.url).pathname : 'Unknown path'}
                         </span>
                         {bug.screenshot_base64 && (
                           <span className="flex items-center gap-1 text-blue-500">
                             <Maximize2 className="w-3 h-3" />
                             Includes Screenshot
                           </span>
                         )}
                       </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-all text-zinc-300",
                      selectedBug?.id === bug.id ? "text-red-500 translate-x-1" : "group-hover:text-zinc-500"
                    )} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bug Details Sidebar */}
        <div className="space-y-6">
           <Card className="sticky top-24 p-0 overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
             {selectedBug ? (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Screenshot Header/Preview */}
                  <div className="aspect-video relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden border-b border-zinc-100 dark:border-zinc-800">
                    {selectedBug.screenshot_base64 ? (
                      <img 
                        src={selectedBug.screenshot_base64} 
                        alt="Bug Screenshot" 
                        className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform"
                        onClick={() => setFullScreenshot(selectedBug.screenshot_base64!)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                        <XCircle className="w-12 h-12 mb-2 opacity-20" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">No Screenshot Captured</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                       <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg border border-white/10">
                         Report Preview
                       </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description</label>
                       <p className="text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed">
                         {selectedBug.description}
                       </p>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">System Information</label>
                       <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                             <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wide">
                               <Globe className="w-3.5 h-3.5" /> URL
                             </div>
                             <span className="text-xs font-mono text-zinc-900 dark:text-zinc-300 truncate max-w-[150px]">
                               {selectedBug.metadata_json?.url || 'N/A'}
                             </span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                             <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wide">
                               <Clock className="w-3.5 h-3.5" /> Time
                             </div>
                             <span className="text-xs font-mono text-zinc-900 dark:text-zinc-300">
                               {new Date(selectedBug.created_at).toLocaleTimeString()}
                             </span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                             <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wide">
                               <Monitor className="w-3.5 h-3.5" /> Viewport
                             </div>
                             <span className="text-xs font-mono text-zinc-900 dark:text-zinc-300">
                               {selectedBug.metadata_json?.viewport?.width}x{selectedBug.metadata_json?.viewport?.height}
                             </span>
                          </div>
                       </div>
                    </div>

                    <div className="pt-2">
                       <p className="text-[9px] font-medium text-zinc-400 line-clamp-2 italic font-mono bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded-lg">
                         UA: {selectedBug.metadata_json?.userAgent || 'Unknown'}
                       </p>
                    </div>

                    <div className="flex gap-3">
                       <Button 
                        variant="primary" 
                        fullWidth 
                        className="bg-green-600 hover:bg-green-700 text-white shadow-green-500/20"
                        onClick={async () => {
                          if (selectedBug) {
                            try {
                              await bugsService.updateStatus(selectedBug.id, 'solved');
                              setSelectedBug(null);
                              fetchBugs(); // Refresh list, which now filters out 'solved'
                            } catch (error) {
                              console.error('Failed to close bug:', error);
                            }
                          }
                        }}
                       >
                         Mark as Solved
                       </Button>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-dashed border-zinc-200 dark:border-zinc-800">
                    <Info className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Details Panel</h4>
                    <p className="text-xs text-zinc-500 mt-1">Select a bug from the list to view screenshots and diagnostics.</p>
                  </div>
               </div>
             )}
           </Card>
        </div>
      </div>

      {/* Full Screenshot Modal */}
      {fullScreenshot && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setFullScreenshot(null)}
        >
          <button 
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[210]"
            onClick={() => setFullScreenshot(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div 
            className="max-w-5xl w-full max-h-full overflow-auto rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={fullScreenshot} 
              alt="Full Bug Screenshot" 
              className="w-full h-auto block"
            />
          </div>
        </div>
      )}
    </div>
  );
}
