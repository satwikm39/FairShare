import { Upload } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SplitterTable } from '../features/splitter/SplitterTable';

export function BillOverview() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Miami Trip Dinner</h1>
          <p className="text-lg text-slate-500 mt-2 font-medium">Split your bill items exactly how they were ordered.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <Card className="border-slate-200/60 shadow-lg">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Receipt Upload</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 group-hover:text-brand-700">Click to upload</p>
                <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
              </div>
            </div>
            <Button fullWidth className="mt-6 shadow-brand-500/20" variant="secondary">Process Receipt</Button>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <SplitterTable />
        </div>
      </div>
    </div>
  );
}
