import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SplitterTable } from '../features/splitter/SplitterTable';
import { useBill } from '../hooks/useBill';
import { cn } from '../lib/utils';

export function BillOverview() {
  // Hardcoded ID 1 for demonstration purposes until routing with real IDs is fully integrated
  const { bill, isLoading, error, uploadReceipt, updateShare } = useBill(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await uploadReceipt(selectedFile);
      setUploadSuccess(true);
      setSelectedFile(null); // Clear selected file after successful upload
    } catch (err) {
      console.error(err);
      // useBill hook manages the error state displayed in the UI
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {bill?.group_id ? `Group ${bill.group_id} Bill` : 'Miami Trip Dinner'}
          </h1>
          <p className="text-lg text-slate-500 mt-2 font-medium">Split your bill items exactly how they were ordered.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <Card className="border-slate-200/60 shadow-lg">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Receipt Upload</h3>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 transition-all cursor-pointer group",
                selectedFile ? "border-brand-400 bg-brand-50" : "border-slate-300 hover:border-brand-400 hover:bg-brand-50/50"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm",
                selectedFile ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600"
              )}>
                {selectedFile ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
              </div>
              <div>
                <p className={cn("font-semibold", selectedFile ? "text-brand-700" : "text-slate-700 group-hover:text-brand-700")}>
                  {selectedFile ? selectedFile.name : "Click to select image"}
                </p>
                {!selectedFile && <p className="text-xs text-slate-500 mt-1">S3 & AWS Textract</p>}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Receipt processed successfully
              </div>
            )}

            <Button 
              fullWidth 
              className="mt-6 shadow-brand-500/20" 
              variant={selectedFile ? "primary" : "secondary"}
              disabled={!selectedFile || isLoading}
              isLoading={isLoading}
              onClick={handleUpload}
            >
              {isLoading ? "Processing via AWS..." : "Process Receipt"}
            </Button>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          {bill ? (
            <SplitterTable bill={bill} onUpdateShare={updateShare} />
          ) : (
            <Card className="border-slate-200/60 shadow-lg text-center p-12 text-slate-500">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <p>Loading bill details...</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
